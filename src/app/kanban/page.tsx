'use client';

import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useTaskStore } from '@/store/useTaskStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Clock, Tag, Calendar } from 'lucide-react';
import { formatDate, getPriorityColor } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Task } from '@/types';

const columns = [
  { id: 'ToDo', title: 'To Do', color: 'bg-gray-100' },
  { id: 'Doing', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'Done', title: 'Done', color: 'bg-green-100' },
];

export default function KanbanPage() {
  const { tasks, fetchTasks, updateTask } = useTaskStore();

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as Task['status'];

    try {
      await updateTask({ id: draggableId, status: newStatus });
      if (newStatus === 'Done') {
        toast.success('Task completed! 🎉');
      }
    } catch {
      toast.error('Failed to update task');
    }
  };

  const getTasksByStatus = (status: Task['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div>
      <Header title="Kanban Board" showSearch={false} />

      <div className="p-6">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {columns.map((column) => (
              <div key={column.id} className={`rounded-lg ${column.color} p-4`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <span className="rounded-full bg-white px-2 py-1 text-sm font-medium text-gray-600">
                    {getTasksByStatus(column.id as Task['status']).length}
                  </span>
                </div>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] space-y-3 rounded-lg transition-colors ${
                        snapshot.isDraggingOver ? 'bg-white/50' : ''
                      }`}
                    >
                      {getTasksByStatus(column.id as Task['status']).map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`rounded-lg bg-white p-4 shadow-sm transition-shadow ${
                                snapshot.isDragging ? 'shadow-lg' : 'hover:shadow-md'
                              }`}
                            >
                              <h4 className="font-medium text-gray-900">{task.title}</h4>

                              {task.description && (
                                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                  {task.description}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                {task.due_date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(task.due_date)}</span>
                                  </div>
                                )}

                                {task.time_estimate > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{task.time_estimate}m</span>
                                  </div>
                                )}

                                {task.tags && (
                                  <div className="flex items-center gap-1">
                                    <Tag className="h-3 w-3" />
                                    <span className="truncate max-w-[80px]">{task.tags}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-2">
                                <span
                                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getPriorityColor(
                                    task.priority
                                  )}`}
                                >
                                  {task.priority}
                                </span>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
