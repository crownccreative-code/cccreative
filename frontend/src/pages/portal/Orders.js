import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ShoppingCart, ArrowRight, X, CreditCard } from 'lucide-react';
import api from '../../api/client';
import { toast } from 'sonner';

export default function PortalOrders() {
  const [orders, setOrders] = useState([]);
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersData, servicesData, packagesData] = await Promise.all([
        api.getOrders(),
        api.getServices(),
        api.getPackages()
      ]);
      setOrders(ordersData);
      setServices(servicesData);
      setPackages(packagesData);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select at least one service or package');
      return;
    }

    setCreating(true);
    try {
      // Create order
      const order = await api.createOrder({});
      
      // Add items
      for (const item of selectedItems) {
        await api.addOrderItem(order.id, {
          service_id: item.type === 'service' ? item.id : null,
          package_id: item.type === 'package' ? item.id : null,
          quantity: 1
        });
      }

      toast.success('Order created!');
      setShowCreate(false);
      setSelectedItems([]);
      fetchData();
      navigate(`/portal/orders/${order.id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  const toggleItem = (item, type) => {
    const itemWithType = { ...item, type };
    const exists = selectedItems.find(i => i.id === item.id && i.type === type);
    if (exists) {
      setSelectedItems(selectedItems.filter(i => !(i.id === item.id && i.type === type)));
    } else {
      setSelectedItems([...selectedItems, itemWithType]);
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
          <p className="text-slate-500 font-mono text-xs uppercase tracking-widest">Manage your service orders</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
          data-testid="create-order-btn"
        >
          <Plus className="w-4 h-4" />
          New Order
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="card p-12 text-center">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">No Orders Yet</h3>
          <p className="text-slate-500 text-sm mb-6">Create your first order to get started</p>
          <button onClick={() => setShowCreate(true)} className="btn-gold" data-testid="empty-create-order-btn">
            Create Order
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/portal/orders/${order.id}`}
              className="card p-6 flex items-center justify-between hover:border-blue-500/30 transition-colors"
              data-testid={`order-${order.id}`}
            >
              <div className="flex items-center gap-6">
                <div className="p-3 bg-blue-500/10 rounded-xl">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold">Order #{order.id.slice(-6)}</p>
                  <p className="text-sm text-slate-500">
                    {order.items?.length || 0} item(s) • {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xl font-bold">${order.total?.toFixed(2)}</p>
                  <span className={`badge badge-${getStatusBadge(order.status)}`}>
                    {order.status?.replace('_', ' ')}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Order Modal */}
      {showCreate && createPortal(
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
            onClick={() => setShowCreate(false)}
          />
          
          {/* Modal */}
          <div 
            style={{
              position: 'relative',
              backgroundColor: '#0A0A0A',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              width: '100%',
              maxWidth: '48rem',
              maxHeight: '90vh',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight text-white">Create New Order</h2>
              <button 
                onClick={() => setShowCreate(false)} 
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              {/* Services */}
              <div className="mb-8">
                <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">Services</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {services.map(service => {
                    const isSelected = selectedItems.find(i => i.id === service.id && i.type === 'service');
                    return (
                      <button
                        key={service.id}
                        onClick={() => toggleItem(service, 'service')}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-500/10' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                        data-testid={`service-${service.id}`}
                      >
                        <p className="font-semibold mb-1 text-white">{service.name}</p>
                        <p className="text-sm text-slate-500 mb-2 line-clamp-2">{service.description}</p>
                        <p className="text-lg font-bold text-blue-400">${service.base_price?.toFixed(2)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Packages */}
              <div>
                <h3 className="text-sm font-mono text-slate-500 uppercase tracking-widest mb-4">Packages</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages.map(pkg => {
                    const isSelected = selectedItems.find(i => i.id === pkg.id && i.type === 'package');
                    return (
                      <button
                        key={pkg.id}
                        onClick={() => toggleItem(pkg, 'package')}
                        className={`p-4 rounded-xl border text-left transition-colors ${
                          isSelected 
                            ? 'border-[#D4AF37] bg-yellow-500/10' 
                            : 'border-white/10 bg-white/5 hover:border-white/20'
                        }`}
                        data-testid={`package-${pkg.id}`}
                      >
                        <span className="badge badge-gold mb-2">{pkg.tier}</span>
                        <p className="font-semibold mb-2 text-white">{pkg.name}</p>
                        <p className="text-xl font-bold text-[#D4AF37]">${pkg.price?.toFixed(2)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Selected: {selectedItems.length} item(s)</p>
                <p className="text-xl font-bold text-white">
                  Total: ${selectedItems.reduce((sum, item) => sum + (item.base_price || item.price || 0), 0).toFixed(2)}
                </p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowCreate(false)} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleCreateOrder}
                  disabled={creating || selectedItems.length === 0}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  data-testid="confirm-create-order-btn"
                >
                  {creating ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Create Order
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
