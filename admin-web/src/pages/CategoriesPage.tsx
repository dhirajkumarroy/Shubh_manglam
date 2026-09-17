import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Layers,
  FolderPlus,
  Folder,
  X
} from 'lucide-react';
import { adminCategoryService, CategoryItem } from '../services/category.service';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  // Filter: 'ALL' | 'ROOT' | 'SUBCAT'
  const [viewFilter, setViewFilter] = useState<'ALL' | 'ROOT' | 'SUBCAT'>('ALL');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<CategoryItem | null>(null);
  const [parentCategory, setParentCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [icon, setIcon] = useState<string>('🎪');
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminCategoryService.listCategories({
        search: search.trim() || undefined,
        limit: 100,
      });
      setCategories(data.categories || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    categories.filter((c) => !c.parentId).forEach((c) => {
      allExpanded[c.id] = true;
    });
    setExpandedCats(allExpanded);
  };

  const collapseAll = () => {
    setExpandedCats({});
  };

  // Open Create Main Category
  const handleOpenCreateMain = () => {
    setEditingItem(null);
    setParentCategory(null);
    setName('');
    setDescription('');
    setIcon('🎪');
    setSortOrder(categories.filter((c) => !c.parentId).length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  // Open Create Subcategory
  const handleOpenCreateSub = (parent: CategoryItem) => {
    setEditingItem(null);
    setParentCategory(parent);
    setName('');
    setDescription('');
    setIcon(parent.icon || '🎪');
    const existingSubs = parent.subcategories || [];
    setSortOrder(existingSubs.length + 1);
    setIsActive(true);
    setShowModal(true);
  };

  // Open Edit
  const handleOpenEdit = (item: CategoryItem) => {
    setEditingItem(item);
    if (item.parentId) {
      const parent = categories.find((c) => c.id === item.parentId);
      setParentCategory(parent || null);
    } else {
      setParentCategory(null);
    }
    setName(item.name);
    setDescription(item.description || '');
    setIcon(item.icon || '🎪');
    setSortOrder(item.sortOrder);
    setIsActive(item.isActive);
    setShowModal(true);
  };

  // Submit Create or Edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Name is required.');
      return;
    }

    try {
      setSubmitting(true);
      if (editingItem) {
        await adminCategoryService.updateCategory(editingItem.id, {
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          sortOrder,
          isActive,
        });
      } else {
        await adminCategoryService.createCategory({
          parentId: parentCategory ? parentCategory.id : null,
          name: name.trim(),
          description: description.trim() || undefined,
          icon: icon.trim() || undefined,
          sortOrder,
          isActive,
        });
      }

      setShowModal(false);
      await fetchCategories();
      if (parentCategory) {
        setExpandedCats((prev) => ({ ...prev, [parentCategory.id]: true }));
      }
    } catch (err: any) {
      alert(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string, isSub: boolean) => {
    const typeLabel = isSub ? 'subcategory' : 'category and all its subcategories';
    if (!window.confirm(`Are you sure you want to delete the ${typeLabel} "${name}"?`)) {
      return;
    }

    try {
      await adminCategoryService.deleteCategory(id);
      await fetchCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete.');
    }
  };

  // Filter root categories vs subcategories based on viewFilter
  const rootCategories = categories.filter((c) => !c.parentId);
  const totalSubcategories = rootCategories.reduce((acc, c) => acc + (c.subcategories?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-black text-[#1C1917] tracking-tight">
              Categories & Subcategory Taxonomy
            </h1>
            <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
              {rootCategories.length} Domains • {totalSubcategories} Subcategories
            </span>
          </div>
          <p className="text-xs text-[#78716C] mt-1">
            Standardized celebration taxonomy. All vendor services are strictly mapped to these categories and subcategories.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={fetchCategories}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E7E0D8] rounded-xl text-xs font-bold text-[#57534E] hover:bg-[#FAF8F5] transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenCreateMain}
            className="flex items-center space-x-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Main Category</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Main Categories</span>
            <Folder className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-[#1C1917] mt-1">{rootCategories.length}</p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Active celebration domains</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Standard Subcategories</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 mt-1">{totalSubcategories}</p>
          <p className="text-[11px] text-[#78716C] font-semibold mt-1">Standardized service items</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-1">
            {rootCategories.filter((c) => c.isActive).length} / {rootCategories.length}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">100% marketplace ready</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#E7E0D8] shadow-sm">
          <div className="flex items-center justify-between text-[#78716C]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Taxonomy Depth</span>
            <Tag className="w-4 h-4 text-secondary" />
          </div>
          <p className="text-2xl font-black text-secondary mt-1">
            {rootCategories.length > 0 ? (totalSubcategories / rootCategories.length).toFixed(1) : 0}
          </p>
          <p className="text-[11px] text-[#78716C] font-semibold mt-1">Avg subcategories / category</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E7E0D8] shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#78716C]" />
          <input
            type="text"
            placeholder="Search categories or subcategories by name, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCategories()}
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                fetchCategories();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs font-bold text-[#57534E] hover:bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl transition"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs font-bold text-[#57534E] hover:bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Categories & Subcategories Tree List */}
      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#E7E0D8] text-[#78716C]">
            <RefreshCw className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <p className="font-semibold text-xs">Loading taxonomy hierarchy...</p>
          </div>
        ) : rootCategories.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-[#E7E0D8] text-[#78716C]">
            <Tag className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-[#1C1917]">No categories found</p>
            <p className="text-xs text-[#78716C]">Try modifying your search or seed the database.</p>
          </div>
        ) : (
          rootCategories.map((cat) => {
            const isExpanded = !!expandedCats[cat.id];
            const subcats = cat.subcategories || [];

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-[#E7E0D8] shadow-sm overflow-hidden transition"
              >
                {/* Main Category Header Row */}
                <div className="p-4 flex items-center justify-between bg-[#FAF8F5]/60 hover:bg-[#FAF8F5] transition">
                  <div
                    onClick={() => toggleExpand(cat.id)}
                    className="flex items-center space-x-3 cursor-pointer flex-1"
                  >
                    <button className="text-[#78716C] hover:text-[#1C1917] p-1">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-primary" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-lg">
                      {cat.icon || '🎪'}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm text-[#1C1917]">{cat.name}</h3>
                        <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#E7E0D8] text-[#78716C]">
                          {cat.slug}
                        </span>
                        {cat.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-200 text-neutral-700">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#78716C] mt-0.5 line-clamp-1">{cat.description}</p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center space-x-2 pl-3">
                    <span className="text-xs font-bold bg-blue-50 text-blue-800 px-2.5 py-1 rounded-full border border-blue-200">
                      {subcats.length} Subcategories
                    </span>

                    <button
                      onClick={() => handleOpenCreateSub(cat)}
                      className="px-2.5 py-1 text-xs font-bold text-primary hover:bg-amber-50 rounded-lg border border-amber-200 transition flex items-center space-x-1"
                      title="Add Subcategory"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Subcategory</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-1.5 text-[#57534E] hover:text-[#1C1917] hover:bg-white rounded-lg border border-[#E7E0D8] transition"
                      title="Edit Category"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => handleDelete(cat.id, cat.name, false)}
                      className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subcategories Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-[#E7E0D8] bg-white p-4">
                    {subcats.length === 0 ? (
                      <div className="p-6 text-center text-[#78716C]">
                        <p className="text-xs">No subcategories defined for this category yet.</p>
                        <button
                          onClick={() => handleOpenCreateSub(cat)}
                          className="mt-2 text-xs font-bold text-primary hover:underline"
                        >
                          + Add the first subcategory
                        </button>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-[#E7E0D8] text-[#78716C] uppercase font-bold text-[10px]">
                              <th className="py-2 px-3">Subcategory</th>
                              <th className="py-2 px-3">Slug</th>
                              <th className="py-2 px-3">Description</th>
                              <th className="py-2 px-3">Sort</th>
                              <th className="py-2 px-3">Status</th>
                              <th className="py-2 px-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E7E0D8]">
                            {subcats.map((sub) => (
                              <tr key={sub.id} className="hover:bg-[#FAF8F5]/50 transition">
                                <td className="py-2.5 px-3 font-bold text-[#1C1917]">
                                  <div className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span>{sub.name}</span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[#78716C]">{sub.slug}</td>
                                <td className="py-2.5 px-3 text-[#78716C] max-w-xs truncate">
                                  {sub.description || '—'}
                                </td>
                                <td className="py-2.5 px-3 font-mono">{sub.sortOrder}</td>
                                <td className="py-2.5 px-3">
                                  {sub.isActive ? (
                                    <span className="text-emerald-700 font-bold">Active</span>
                                  ) : (
                                    <span className="text-neutral-500 font-medium">Inactive</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end space-x-1.5">
                                    <button
                                      onClick={() => handleOpenEdit(sub)}
                                      className="p-1 text-[#57534E] hover:text-[#1C1917] rounded hover:bg-[#FAF8F5]"
                                      title="Edit"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete(sub.id, sub.name, true)}
                                      className="p-1 text-rose-600 hover:text-rose-700 rounded hover:bg-rose-50"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-[#E7E0D8] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#E7E0D8] flex items-center justify-between bg-[#FAF8F5]">
              <div>
                <h3 className="font-bold text-base text-[#1C1917]">
                  {editingItem
                    ? `Edit ${editingItem.parentId ? 'Subcategory' : 'Category'}`
                    : parentCategory
                    ? `Add Subcategory under ${parentCategory.name}`
                    : 'Create New Main Category'}
                </h3>
                {parentCategory && (
                  <p className="text-xs text-primary font-semibold mt-0.5">
                    Parent Domain: {parentCategory.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#78716C] hover:text-[#1C1917] p-1.5 rounded-lg hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1">
                <label className="font-bold text-[#1C1917]">
                  {parentCategory || editingItem?.parentId ? 'Subcategory Name *' : 'Category Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stage Decoration or Full Wedding Buffet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-bold text-[#1C1917]">Description</label>
                <textarea
                  rows={3}
                  placeholder="Brief description of what services fall under this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary focus:bg-white"
                />
              </div>

              {/* Icon & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1917]">Icon / Emoji</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1917]">Display Order</label>
                  <input
                    type="number"
                    min={0}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border border-[#E7E0D8] rounded-xl focus:outline-none focus:border-primary focus:bg-white"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#E7E0D8]">
                <div>
                  <p className="font-bold text-[#1C1917]">Active in Marketplace</p>
                  <p className="text-[#78716C] text-[11px]">Allow vendors and customers to select this taxonomy item</p>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E7E0D8]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-[#FAF8F5] hover:bg-[#F5EFE6] border border-[#E7E0D8] rounded-xl font-bold text-[#57534E] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition flex items-center space-x-1.5"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingItem ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesPage;
