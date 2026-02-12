import React from 'react';
import { Equation, GameVariable } from '../types';
import { VisualExpression } from './VisualExpression';
import { Equal } from 'lucide-react';

interface EquationRowProps {
  equation: Equation;
  variables: GameVariable[];
  index: number;
}

export const EquationRow: React.FC<EquationRowProps> = ({ equation, variables, index }) => {
  return (
    <div 
      className="flex items-center justify-center bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-slate-100 w-full animate-fade-in"
      style={{ animationDelay: `${index * 150}ms` }}
    >
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        <VisualExpression 
          items={equation.items} 
          variables={variables} 
          iconSize={40}
        />
        
        <Equal className="text-slate-400 w-6 h-6 sm:w-8 sm:h-8 mx-1 sm:mx-2" strokeWidth={3} />
        
        <span className="text-3xl sm:text-4xl font-display font-bold text-slate-700">
          {equation.result}
        </span>
      </div>
    </div>
  );
};