import React from 'react';
import { GameVariable, EquationItem } from '../types';
import { ShapeIcon } from './ShapeIcon';
import { Plus } from 'lucide-react';

interface VisualExpressionProps {
  items: EquationItem[];
  variables: GameVariable[];
  iconSize?: number;
  className?: string;
  animate?: boolean;
}

export const VisualExpression: React.FC<VisualExpressionProps> = ({ 
  items, 
  variables, 
  iconSize = 40,
  className = '',
  animate = false
}) => {
  const visualItems: GameVariable[] = [];
  
  items.forEach(item => {
    const variable = variables.find(v => v.id === item.variableId);
    if (variable) {
      for (let i = 0; i < item.count; i++) {
        visualItems.push(variable);
      }
    }
  });

  return (
    <div className={`flex flex-wrap items-center justify-center gap-2 sm:gap-3 ${className}`}>
      {visualItems.map((v, idx) => (
        <React.Fragment key={`expr-item-${idx}`}>
          {idx > 0 && <Plus className="text-slate-400 w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />}
          <ShapeIcon 
            shape={v.shape} 
            color={v.color} 
            size={iconSize} 
            className={animate ? "animate-bounce-slow" : ""} 
          />
        </React.Fragment>
      ))}
    </div>
  );
};