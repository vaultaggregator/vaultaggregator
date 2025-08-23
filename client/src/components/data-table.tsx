import { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  dense?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  onRowClick,
  className,
  dense = true
}: DataTableProps<T>) {
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (columnKey: string) => {
    if (sortBy === columnKey) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(columnKey);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortBy) return 0;
    
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    // Handle numeric sorting
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    // Handle string sorting
    const aStr = String(aValue || '');
    const bStr = String(bValue || '');
    
    return sortOrder === 'asc' 
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  "text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                  dense ? "px-3 py-2" : "px-6 py-3",
                  column.align === 'center' && "text-center",
                  column.align === 'right' && "text-right",
                  (!column.align || column.align === 'left') && "text-left",
                  column.sortable && "cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                )}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div className={cn(
                  "flex items-center gap-1",
                  column.align === 'center' && "justify-center",
                  column.align === 'right' && "justify-end"
                )}>
                  <span>{column.header}</span>
                  {column.sortable && sortBy === column.key && (
                    sortOrder === 'desc' ? 
                      <ChevronDown className="h-3 w-3" /> : 
                      <ChevronUp className="h-3 w-3" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => (
            <tr
              key={index}
              className={cn(
                "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "text-sm text-gray-900 dark:text-gray-100",
                    dense ? "px-3 py-2" : "px-6 py-4",
                    column.align === 'center' && "text-center",
                    column.align === 'right' && "text-right",
                    (!column.align || column.align === 'left') && "text-left"
                  )}
                >
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {data.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      )}
    </div>
  );
}

// Pill Filter Component
interface PillFilterProps {
  options: { value: string; label: string }[];
  selected: string | null;
  onChange: (value: string | null) => void;
  label?: string;
}

export function PillFilter({ options, selected, onChange, label }: PillFilterProps) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
      )}
      <div className="flex gap-1.5">
        <button
          onClick={() => onChange(null)}
          className={cn(
            "px-3 py-1 text-xs rounded-full transition-colors",
            !selected
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          )}
        >
          All
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "px-3 py-1 text-xs rounded-full transition-colors",
              selected === option.value
                ? "bg-blue-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}