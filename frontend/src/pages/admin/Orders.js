import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShoppingCart, Eye, RefreshCw, X } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const data = await api.getOrders(statusFilter || null);
      setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrder(orderId, { status: newStatus });
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        const updated = await api.getOrder(orderId);
        setSelectedOrder(updated);
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'default',
      pending: 'yellow',
      paid: 'green',
      in_progress: 'blue',
      completed: 'green',
      canceled: 'red',
      refunded: 'red'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">Orders</h1>
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Manage all customer orders</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-box w-40"
            data-testid="status-filter"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="canceled">Canceled</option>
            <option value="refunded">Refunded</option>
          </select>
          <button
            onClick={fetchOrders}
            className="btn-secondary flex items-center gap-2"
            data-testid="refresh-orders-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-slate-500">
                    No orders found
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} data-testid={`admin-order-${order.id}`}>
                    <td>
                      <span className="font-mono text-sm">#{order.id.slice(-6)}</span>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold">{order.user_name}</p>
                        <p className="text-xs text-slate-500">{order.user_email}</p>
                      </div>
                    </td>
                    <td>
                      <span className="text-sm">{order.items?.length || 0} items</span>
                    </td>
                    <td>
                      <span className="font-bold">${order.total?.toFixed(2)}</span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`badge badge-${getStatusBadge(order.status)} bg-transparent border-none cursor-pointer`}
                        data-testid={`order-status-${order.id}`}
                      >
                        <option value="draft">Draft</option>
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="canceled">Canceled</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td>
                      <span className="text-sm text-slate-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                        data-testid={`view-order-${order.id}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && createPortal(
        <div 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
        >
          {/* Dark overlay */}
          <div 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.9)'
            }}
            onClick={() => setSelectedOrder(null)}
            aria-hidden="true"
          />
          
          {/* Modal container */}
          <div 
            style={{
              position: 'relative',
              backgroundColor: '#0A0A0A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '42rem',
              maxHeight: '90vh',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">Order #{selectedOrder.id.slice(-6)}</h2>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                data-testid="close-order-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '70vh' }}>
              {/* Customer Info */}
              <div className="mb-6">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Customer</h4>
                <p className="font-semibold text-white">{selectedOrder.user_name}</p>
                <p className="text-sm text-slate-400">{selectedOrder.user_email}</p>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map(item => (
                    <div key={item.id} className="flex justify-between p-3 bg-white/5 rounded-lg">
                      <span className="text-white">{item.service_name || item.package_name}</span>
                      <span className="font-bold text-white">${item.line_total?.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="border-t border-white/5 pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Subtotal</span>
                  <span className="text-white">${selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-white">Total</span>
                  <span className="text-white">${selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="mt-6 pt-6 border-t border-white/5">
                  <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Notes</h4>
                  <p className="text-sm text-slate-400">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
