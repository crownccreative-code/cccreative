import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Trash2, FileText } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function PortalOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const data = await api.getOrder(id);
      setOrder(data);
    } catch (error) {
      toast.error('Order not found');
      navigate('/portal/orders');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (order.total <= 0) {
      toast.error('Order total must be greater than 0');
      return;
    }

    setPaying(true);
    try {
      const { url } = await api.createCheckoutSession(order.id);
      window.location.href = url;
    } catch (error) {
      toast.error(error.message || 'Failed to create checkout session');
      setPaying(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await api.removeOrderItem(order.id, itemId);
      toast.success('Item removed');
      fetchOrder();
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.updateOrder(order.id, { status: 'canceled' });
      toast.success('Order cancelled');
      fetchOrder();
    } catch (error) {
      toast.error('Failed to cancel order');
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

  if (!order) return null;

  const canPay = order.status === 'draft' || order.status === 'pending';
  const canModify = order.status === 'draft';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <Link to="/portal/orders" className="flex items-center gap-2 text-slate-500 hover:text-white text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <h1 className="text-3xl font-black uppercase tracking-tight mb-2">
            Order #{order.id.slice(-6)}
          </h1>
          <div className="flex items-center gap-4">
            <span className={`badge badge-${getStatusBadge(order.status)}`}>
              {order.status?.replace('_', ' ')}
            </span>
            <span className="text-slate-500 text-sm">
              Created {new Date(order.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex gap-4">
          {canModify && (
            <button onClick={handleCancel} className="btn-secondary text-red-400" data-testid="cancel-order-btn">
              Cancel Order
            </button>
          )}
          {canPay && order.items?.length > 0 && (
            <button
              onClick={handlePayment}
              disabled={paying}
              className="btn-gold flex items-center gap-2"
              data-testid="pay-order-btn"
            >
              {paying ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Now
                </>
              )}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-white/5">
              <h2 className="text-lg font-bold uppercase tracking-tight">Order Items</h2>
            </div>
            {order.items?.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">No items in this order</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {order.items?.map(item => (
                  <div key={item.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{item.service_name || item.package_name}</p>
                      <p className="text-sm text-slate-500">
                        {item.service_id ? 'Service' : 'Package'} • Qty: {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-lg font-bold">${item.line_total?.toFixed(2)}</p>
                        <p className="text-xs text-slate-500">${item.unit_price?.toFixed(2)} each</p>
                      </div>
                      {canModify && (
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          data-testid={`remove-item-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div>
          <div className="card p-6">
            <h2 className="text-lg font-bold uppercase tracking-tight mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold">${order.subtotal?.toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-semibold">${order.tax?.toFixed(2)}</span>
                </div>
              )}
              {order.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-${order.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-white/10 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="text-2xl font-black">${order.total?.toFixed(2)}</span>
              </div>
            </div>

            {canPay && order.items?.length > 0 && (
              <button
                onClick={handlePayment}
                disabled={paying}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
                data-testid="pay-order-summary-btn"
              >
                {paying ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Proceed to Payment
                  </>
                )}
              </button>
            )}

            {order.notes && (
              <div className="mt-6 pt-6 border-t border-white/5">
                <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">Notes</p>
                <p className="text-sm text-slate-400">{order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
