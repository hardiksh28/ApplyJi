import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../lib/utils';
import { Building2, MapPin, DollarSign, Clock, MoreVertical, MessageSquare, Sparkles } from 'lucide-react';

interface KanbanCardProps {
  id: string;
  application: any;
  onClick: (app: any) => void;
}

function KanbanCard({ id, application, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick(application)}
      className={cn(
        "glass-card p-4 mb-3 cursor-grab active:cursor-grabbing group hover:border-brand-primary/50 transition-all",
        isDragging && "opacity-50 grayscale scale-95"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-lg bg-surface-dark border border-border-dark flex items-center justify-center font-bold text-slate-400 group-hover:text-brand-primary transition-all">
          {application.company_name[0]}
        </div>
        <button className="p-1 text-slate-600 hover:text-white transition-colors">
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>
      
      <h4 className="text-sm font-bold text-white mb-1 group-hover:text-brand-primary transition-colors truncate">{application.job_title}</h4>
      <p className="text-[11px] text-slate-400 mb-4">{application.company_name}</p>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <MapPin className="w-3 h-3" /> {application.location || 'Remote'}
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
           <div className="flex items-center gap-2 text-[9px] text-slate-600 font-mono">
              <Clock className="w-2.5 h-2.5" /> {new Date(application.applied_at || application.created_at).toLocaleDateString()}
           </div>
           <div className="flex items-center gap-2">
              {application.notes && <MessageSquare className="w-3 h-3 text-slate-600" />}
              {application.interview_prep_data?.questions && <Sparkles className="w-3 h-3 text-amber-500" />}
           </div>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  id: string;
  title: string;
  applications: any[];
  onCardClick: (app: any) => void;
}

function KanbanColumn({ id, title, applications, onCardClick }: KanbanColumnProps) {
  const { setNodeRef } = useSortable({ id });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-2">
          <div className={cn("w-1.5 h-1.5 rounded-full", getStatusColor(id))}></div>
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">{title}</h3>
          <span className="text-[10px] font-bold text-slate-500 bg-surface-dark px-1.5 py-0.5 rounded border border-border-dark">{applications.length}</span>
        </div>
      </div>
      
      <div 
        ref={setNodeRef}
        className="flex-1 bg-surface-dark/20 rounded-2xl border border-border-dark/50 p-2 min-h-[500px]"
      >
        <SortableContext id={id} items={applications.map(a => a.id)} strategy={verticalListSortingStrategy}>
          {applications.map((app) => (
            <KanbanCard key={app.id} id={app.id} application={app} onClick={onCardClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({ applications, onStatusChange, onCardClick }: { applications: any[], onStatusChange: (id: string, status: string) => void, onCardClick: (app: any) => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const columns = [
    { id: 'saved', title: 'Saved' },
    { id: 'applied', title: 'Applied' },
    { id: 'screening', title: 'Screening' },
    { id: 'interviewing', title: 'Interviewing' },
    { id: 'offered', title: 'Offer' },
    { id: 'rejected', title: 'Rejected' },
  ];

  const getAppsByStatus = (status: string) => applications.filter(a => (a.status || 'applied').toLowerCase() === status.toLowerCase());

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const appId = active.id as string;
    const overId = over.id as string;

    // Determine new status based on where it was dropped
    const newStatus = columns.find(c => c.id === overId)?.id || 
                    applications.find(a => a.id === overId)?.status;

    if (newStatus && newStatus !== applications.find(a => a.id === appId)?.status) {
      onStatusChange(appId, newStatus);
    }

    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide h-full items-start">
        {columns.map((col) => (
          <KanbanColumn 
            key={col.id} 
            id={col.id} 
            title={col.title} 
            applications={getAppsByStatus(col.id)}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      
      <DragOverlay dropAnimation={{
        sideEffects: defaultDropAnimationSideEffects({
          styles: {
            active: {
              opacity: '0.5',
            },
          },
        }),
      }}>
        {activeId ? (
          <KanbanCard 
            id={activeId} 
            application={applications.find(a => a.id === activeId)} 
            onClick={onCardClick}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function getStatusColor(status: string) {
  switch (status) {
    case 'saved': return 'bg-slate-400';
    case 'applied': return 'bg-blue-400';
    case 'screening': return 'bg-indigo-400';
    case 'interviewing': return 'bg-amber-400';
    case 'offered': return 'bg-emerald-400';
    case 'rejected': return 'bg-rose-400';
    default: return 'bg-slate-400';
  }
}
