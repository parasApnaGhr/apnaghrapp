import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  MapPin, Plus, Edit2, Trash2, User, Clock, IndianRupee, 
  CheckCircle, XCircle, AlertCircle, Send, Eye
} from 'lucide-react';
import { toast } from 'sonner';

const ToLetTasksPanel = () => {
  const [tasks, setTasks] = useState([]);
  const [pendingApproval, setPendingApproval] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  const [newRate, setNewRate] = useState('');
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    location: '',
    rate_per_board: 10,
    estimated_boards: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, pendingRes, ridersRes] = await Promise.all([
        api.get('/admin/tolet-tasks'),
        api.get('/admin/tolet-tasks/pending-approval'),
        api.get('/admin/riders/online')
      ]);
      setTasks(tasksRes.data);
      setPendingApproval(pendingRes.data);
      setRiders(ridersRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async () => {
    try {
      await api.post('/admin/tolet-tasks', newTask);
      toast.success('ToLet task created and sent to riders!');
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', location: '', rate_per_board: 10, estimated_boards: 1 });
      loadData();
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleAssignTask = async (taskId, riderId) => {
    try {
      await api.post(`/admin/tolet-tasks/${taskId}/assign`, { rider_id: riderId });
      toast.success('Task assigned to rider!');
      setShowAssignModal(null);
      loadData();
    } catch (error) {
      toast.error('Failed to assign task');
    }
  };

  const handleUpdateRate = async (taskId) => {
    try {
      await api.patch(`/admin/tolet-tasks/${taskId}`, { rate_per_board: parseFloat(newRate) });
      toast.success('Rate updated!');
      setEditingRate(null);
      loadData();
    } catch (error) {
      toast.error('Failed to update rate');
    }
  };

  const handleApproveTask = async (taskId, approved) => {
    try {
      await api.post(`/admin/tolet-tasks/${taskId}/approve`, { 
        approved, 
        rejection_reason: approved ? null : 'Task rejected by admin' 
      });
      toast.success(approved ? 'Task approved!' : 'Task rejected');
      loadData();
    } catch (error) {
      toast.error('Failed to process');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: { class: 'bg-blue-100 text-blue-800', text: 'Open' },
      assigned: { class: 'bg-purple-100 text-purple-800', text: 'Assigned' },
      in_progress: { class: 'bg-amber-100 text-amber-800', text: 'In Progress' },
      completed: { class: 'bg-green-100 text-green-800', text: 'Completed' },
      verified: { class: 'bg-emerald-100 text-emerald-800', text: 'Verified' },
      rejected: { class: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    return badges[status] || { class: 'bg-gray-100 text-gray-800', text: status };
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-[#E07A5F] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Outfit' }}>ToLet Board Tasks</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2"
          data-testid="create-tolet-task-button"
        >
          <Plus className="w-4 h-4" />
          Create Task
        </button>
      </div>

      {/* Pending Approval Section */}
      {pendingApproval.length > 0 && (
        <div className="mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Pending Approval ({pendingApproval.length})
          </h3>
          <div className="space-y-3">
            {pendingApproval.map(task => (
              <div key={task.id} className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold">{task.title}</h4>
                    <p className="text-sm text-[#4A626C]">{task.location}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span><User className="w-4 h-4 inline mr-1" />{task.rider?.name}</span>
                      <span>Boards: {task.actual_boards_collected}</span>
                      <span className="text-[#2A9D8F] font-bold">₹{task.earnings}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveTask(task.id, true)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      data-testid={`approve-task-${task.id}`}
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleApproveTask(task.id, false)}
                      className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                      data-testid={`reject-task-${task.id}`}
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Tasks */}
      <div className="space-y-4">
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-[#E5E3D8]">
            <MapPin className="w-12 h-12 text-[#4A626C] mx-auto mb-3 opacity-50" />
            <p className="text-[#4A626C]">No ToLet tasks created yet</p>
          </div>
        ) : (
          tasks.map(task => {
            const statusInfo = getStatusBadge(task.status);
            return (
              <div key={task.id} className="bg-white rounded-xl border border-[#E5E3D8] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-bold text-lg">{task.title}</h4>
                    <p className="text-sm text-[#4A626C]">{task.description}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
                    {statusInfo.text}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#E07A5F]" />
                    {task.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4 text-[#2A9D8F]" />
                    {editingRate === task.id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={newRate}
                          onChange={(e) => setNewRate(e.target.value)}
                          className="w-16 px-2 py-1 border rounded"
                        />
                        <button onClick={() => handleUpdateRate(task.id)} className="text-[#2A9D8F]">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span 
                        className="cursor-pointer hover:text-[#E07A5F]"
                        onClick={() => { setEditingRate(task.id); setNewRate(task.rate_per_board.toString()); }}
                      >
                        ₹{task.rate_per_board}/board <Edit2 className="w-3 h-3 inline" />
                      </span>
                    )}
                  </span>
                  <span>Est. {task.estimated_boards} boards</span>
                </div>

                {task.rider && (
                  <div className="bg-[#F3F2EB] rounded-lg p-2 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#4A626C]" />
                    <span className="text-sm">Assigned to: <strong>{task.rider.name}</strong></span>
                  </div>
                )}

                {task.status === 'open' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAssignModal(task)}
                      className="btn-secondary flex-1 flex items-center justify-center gap-2"
                      data-testid={`assign-task-${task.id}`}
                    >
                      <Send className="w-4 h-4" />
                      Assign to Rider
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Create ToLet Task</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Collect boards from Sector 17"
                  className="input-field"
                  data-testid="task-title-input"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Additional details..."
                  className="input-field"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input
                  type="text"
                  value={newTask.location}
                  onChange={(e) => setNewTask({ ...newTask, location: e.target.value })}
                  placeholder="Full address"
                  className="input-field"
                  data-testid="task-location-input"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rate per Board (₹)</label>
                  <input
                    type="number"
                    value={newTask.rate_per_board}
                    onChange={(e) => setNewTask({ ...newTask, rate_per_board: parseFloat(e.target.value) })}
                    className="input-field"
                    data-testid="task-rate-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Est. Boards</label>
                  <input
                    type="number"
                    value={newTask.estimated_boards}
                    onChange={(e) => setNewTask({ ...newTask, estimated_boards: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={handleCreateTask} className="btn-primary flex-1" data-testid="submit-task-button">
                Create & Notify Riders
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Assign Task to Rider</h3>
            <p className="text-sm text-[#4A626C] mb-4">{showAssignModal.title}</p>
            
            {riders.length === 0 ? (
              <p className="text-center py-6 text-[#4A626C]">No online riders available</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {riders.map(rider => (
                  <button
                    key={rider.id}
                    onClick={() => handleAssignTask(showAssignModal.id, rider.id)}
                    className="w-full p-3 bg-[#F3F2EB] rounded-lg hover:bg-[#E5E3D8] flex items-center gap-3 text-left"
                    data-testid={`select-rider-${rider.id}`}
                  >
                    <div className="w-10 h-10 bg-[#E07A5F] text-white rounded-full flex items-center justify-center font-bold">
                      {rider.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{rider.name}</p>
                      <p className="text-xs text-[#4A626C]">{rider.phone}</p>
                    </div>
                    <div className="ml-auto w-2 h-2 bg-green-500 rounded-full"></div>
                  </button>
                ))}
              </div>
            )}

            <button onClick={() => setShowAssignModal(null)} className="btn-secondary w-full mt-4">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToLetTasksPanel;
