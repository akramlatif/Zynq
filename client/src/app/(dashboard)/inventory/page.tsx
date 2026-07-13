'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Filter, Edit2, Loader2, X, Barcode } from 'lucide-react';
import { toast } from 'sonner';

// Types
type Product = {
  id: string;
  name: string;
  category: string;
  qty: number;
  price: number;
  threshold: number;
  expiry: string;
  barcode: string;
};

// API calls
const fetchInventory = async () => {
  const res = await fetch('/api/inventory');
  if (!res.ok) throw new Error('Failed to fetch inventory');
  const data = await res.json();
  return data.products as Product[];
};

const addProduct = async (product: Omit<Product, 'id'>) => {
  const res = await fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to add product');
  return res.json();
};

const updateProduct = async (product: Product) => {
  const res = await fetch('/api/inventory', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error('Failed to update product');
  return res.json();
};

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ id: string, field: keyof Product } | null>(null);
  const [editValue, setEditValue] = useState<string | number>('');

  const [newProduct, setNewProduct] = useState({
    name: '', category: 'Grocery', qty: 0, price: 0, threshold: 10, expiry: '', barcode: ''
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
    refetchInterval: 60000,
  });

  const addMutation = useMutation({
    mutationFn: addProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddModalOpen(false);
      toast.success('Product added successfully!');
      setNewProduct({ name: '', category: 'Grocery', qty: 0, price: 0, threshold: 10, expiry: '', barcode: '' });
    },
    onError: () => toast.error('Failed to add product')
  });

  const updateMutation = useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setEditingCell(null);
      toast.success('Product updated!');
    },
    onError: () => toast.error('Failed to update product')
  });

  // Derived data
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
  
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode.includes(searchTerm);
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Handlers
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate(newProduct);
  };

  const handleCellClick = (product: Product, field: keyof Product) => {
    setEditingCell({ id: product.id, field });
    setEditValue(product[field]);
  };

  const handleCellBlur = (product: Product) => {
    if (!editingCell) return;
    
    // Check if value changed
    if (product[editingCell.field] !== editValue) {
      updateMutation.mutate({
        ...product,
        [editingCell.field]: editValue
      });
    } else {
      setEditingCell(null);
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent, product: Product) => {
    if (e.key === 'Enter') {
      handleCellBlur(product);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  const getQtyColor = (qty: number, threshold: number) => {
    if (qty <= threshold) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold border-red-200 dark:border-red-800/50';
    if (qty <= threshold * 2) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 font-bold border-orange-200 dark:border-orange-800/50';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  };

  return (
    <div className="space-y-6 relative h-[calc(100vh-100px)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Inventory</h1>
          <p className="text-sm text-slate-500">Manage your products and stock levels.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl transition-all shadow-sm font-medium"
        >
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 shrink-0">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products or scan barcode..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
          />
        </div>
        <div className="relative">
          <Filter className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-8 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none min-w-[150px]"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-4 font-medium">Name & Barcode</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Qty (Edit)</th>
                  <th className="p-4 font-medium">Price (Edit)</th>
                  <th className="p-4 font-medium">Expiry</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{product.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{product.barcode || 'No barcode'}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-medium">
                        {product.category}
                      </span>
                    </td>
                    
                    {/* Inline Edit QTY */}
                    <td className="p-4" onClick={() => handleCellClick(product, 'qty')}>
                      {editingCell?.id === product.id && editingCell?.field === 'qty' ? (
                        <input 
                          type="number"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          onBlur={() => handleCellBlur(product)}
                          onKeyDown={(e) => handleCellKeyDown(e, product)}
                          className="w-20 px-2 py-1 border border-primary rounded bg-white dark:bg-slate-900 focus:outline-none"
                        />
                      ) : (
                        <span className={`inline-block px-3 py-1 rounded-full text-sm border cursor-pointer hover:opacity-80 transition-opacity ${getQtyColor(product.qty, product.threshold)}`}>
                          {product.qty}
                        </span>
                      )}
                    </td>

                    {/* Inline Edit PRICE */}
                    <td className="p-4" onClick={() => handleCellClick(product, 'price')}>
                      {editingCell?.id === product.id && editingCell?.field === 'price' ? (
                        <input 
                          type="number"
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(Number(e.target.value))}
                          onBlur={() => handleCellBlur(product)}
                          onKeyDown={(e) => handleCellKeyDown(e, product)}
                          className="w-24 px-2 py-1 border border-primary rounded bg-white dark:bg-slate-900 focus:outline-none"
                        />
                      ) : (
                        <span className="cursor-pointer hover:text-primary transition-colors border-b border-transparent hover:border-primary border-dashed">
                          Rs {product.price.toLocaleString()}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-sm">
                      {product.expiry || '-'}
                    </td>
                    
                    <td className="p-4 text-right">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-full">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New Product</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-product-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Name</label>
                  <input required type="text" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <input required type="text" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Barcode</label>
                    <div className="relative">
                      <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input type="text" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" placeholder="Scan..." />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Price (Rs)</label>
                    <input required type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Initial Qty</label>
                    <input required type="number" value={newProduct.qty} onChange={e => setNewProduct({...newProduct, qty: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Alert Thresh.</label>
                    <input required type="number" value={newProduct.threshold} onChange={e => setNewProduct({...newProduct, threshold: Number(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expiry Date (Optional)</label>
                  <input type="date" value={newProduct.expiry} onChange={e => setNewProduct({...newProduct, expiry: e.target.value})} className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 focus:outline-none focus:border-primary" />
                </div>
              </form>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3 shrink-0">
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium">
                Cancel
              </button>
              <button type="submit" form="add-product-form" disabled={addMutation.isPending} className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl transition-colors font-medium flex items-center gap-2">
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
