import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from './ui/card';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color: string;
}

export function StatsCard({ label, value, icon: Icon, trend, color }: StatsCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02, rotateX: 2, rotateY: 2 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="perspective-1000"
    >
      <Card className="overflow-hidden border-none shadow-lg bg-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{label}</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900">{value}</h3>
              {trend && (
                <p className="text-xs font-medium text-emerald-600 mt-1">
                  {trend} <span className="text-gray-400">vs last month</span>
                </p>
              )}
            </div>
            <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
              <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
