import React, { useState, useEffect } from 'react';
import { Product, Address, CampaignDetail, GroupedItems } from '@/types/types';
import {
  Calendar,
  ChevronDown,
  Package,
  MapPin,
  RefreshCw,
  Eye,
  X,
} from 'lucide-react';
import { getItemsByCategory } from '@/services/CampaignService';
import ItemDetailModal from './ItemDetailModal';
import CampaignApprovalDialog from './CampaignApprovalDialog';

interface CampaignItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Product[];
  viewMode: 'campaign-items' | 'suggested-items';
  selectedCampaign: CampaignDetail;
  onRefresh?: (campaignId: string) => Promise<void>;
  onViewModeChange?: (mode: 'campaign-items' | 'suggested-items') => void;
}

const ITEM_STATUS_TRANSLATIONS = {
  Pending: 'Chờ duyệt',
  Approved: 'Đã chấp nhận vào chiến dịch',
  Rejected: 'Đã từ chối',
  Hold_On: 'Tạm giữ',
  Requesting: 'Đang yêu cầu',
  In_Transaction: 'Đang tiếp nhận',
  Not_Completed: 'Không chấp nhận vào chiến dịch',
  All: 'Tất cả',
} as const;

type ItemStatusType = keyof typeof ITEM_STATUS_TRANSLATIONS;

const CampaignItemsModal: React.FC<CampaignItemsModalProps> = ({
  isOpen,
  onClose,
  items,
  viewMode,
  selectedCampaign,
  onRefresh,
  onViewModeChange,
}) => {
  const [groupedItems, setGroupedItems] = useState<GroupedItems>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [selectedViewItem, setSelectedViewItem] = useState<any>(null);
  const [isItemDetailModalOpen, setIsItemDetailModalOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [appointmentDate, setAppointmentDate] = useState<string>('');
  const [itemStatusFilter, setItemStatusFilter] =
    useState<ItemStatusType>('All');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedAddresses, setExpandedAddresses] = useState<Set<string>>(
    new Set(),
  );
  const [suggestedItems, setSuggestedItems] = useState<any[]>([]);
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalDialogType, setApprovalDialogType] = useState<
    'approve' | 'reject'
  >('approve');
  const [searchTerm, setSearchTerm] = useState('');

  // Initial checkboxes state
  useEffect(() => {
    setSelectedItems(new Set());
    setSelectedAddress(null);
    setAppointmentDate('');
  }, [isOpen]);

  useEffect(() => {
    if (viewMode === 'campaign-items') {
      // Existing campaign items grouping logic
      const grouped = items.reduce((acc: GroupedItems, item) => {
        const userId = item.owner_id;
        const addressId = item.address.addressId;

        if (!acc[userId]) {
          acc[userId] = {
            user: {
              id: userId,
              name: item.owner_Name,
              image: item.profilePicture,
            },
            addresses: {},
          };
        }

        if (!acc[userId].addresses[addressId]) {
          acc[userId].addresses[addressId] = {
            address: item.address,
            items: [],
          };
        }

        acc[userId].addresses[addressId].items.push(item);
        return acc;
      }, {});

      setGroupedItems(grouped);
    } else if (viewMode === 'suggested-items' && selectedCampaign) {
      // Set initial category and fetch suggested items
      const initialCategory = selectedCampaign.categories[0]?.id;
      if (initialCategory && !selectedCategory) {
        setSelectedCategory(initialCategory);
        fetchSuggestedItems(initialCategory);
      }
    }
  }, [items, viewMode, selectedCampaign, refreshKey]);

  // Fetch suggested items
  const fetchSuggestedItems = async (categoryId: string) => {
    try {
      setIsLoadingSuggested(true);
      const response = await getItemsByCategory(categoryId);
      if (response.isSuccess) {
        setSuggestedItems(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching suggested items:', error);
      setSuggestedItems([]);
    } finally {
      setIsLoadingSuggested(false);
    }
  };

  // Handle category change
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    fetchSuggestedItems(categoryId);
  };

  // Handle confirm selection
  const handleConfirmSelection = () => {
    setApprovalDialogType('approve');
    setIsApprovalDialogOpen(true);
  };

  // Handle reject selection
  const handleRejectSelection = () => {
    setApprovalDialogType('reject');
    setIsApprovalDialogOpen(true);
  };

  // Refresh suggested items
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    if (selectedCategory) {
      fetchSuggestedItems(selectedCategory);
    }
  };

  const handleRefreshItems = () => {
    if (selectedCampaign && onRefresh) {
      onRefresh(selectedCampaign.id);
      setRefreshKey((prev) => prev + 1);
      clearAllSelections();
    }
  };

  useEffect(() => {
    // Group items by user and address
    const grouped = items.reduce((acc: GroupedItems, item) => {
      const userId = item.owner_id;
      const addressId = item.address.addressId;

      if (!acc[userId]) {
        acc[userId] = {
          user: {
            id: userId,
            name: item.owner_Name,
            image: item.profilePicture,
          },
          addresses: {},
        };
      }

      if (!acc[userId].addresses[addressId]) {
        acc[userId].addresses[addressId] = {
          address: item.address,
          items: [],
        };
      }

      acc[userId].addresses[addressId].items.push(item);
      return acc;
    }, {});

    setGroupedItems(grouped);
  }, [items]);

  // This effect to handle refresh
  useEffect(() => {
    if (selectedCampaign && onRefresh) {
      onRefresh(selectedCampaign.id);
    }
  }, [refreshKey]);

  const clearAllSelections = () => {
    setSelectedItems(new Set());
    setSelectedUserId(null);
    setSelectedAddressId(null);
  };

  const toggleUser = (userId: string, userData: any) => {
    const newExpanded = new Set(expandedUsers);
    const isExpanded = newExpanded.has(userId);

    if (isExpanded) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
      // Expand all addresses for this user
      const userAddresses = Object.values(userData.addresses);
      setExpandedAddresses((prev) => {
        const newSet = new Set(prev);
        userAddresses.forEach((address: any) => {
          newSet.add(address.address.addressId);
        });
        return newSet;
      });
    }

    setExpandedUsers(newExpanded);
  };

  const toggleAddress = (
    userId: string,
    addressId: string,
    addressItems: Product[],
  ) => {
    const addressItemIds = addressItems.map((item) => item.id);
    const allSelected = addressItemIds.every((itemId) =>
      selectedItems.has(itemId),
    );
    const isNewAddress = !selectedAddressId || selectedAddressId !== addressId;

    if (isNewAddress) {
      setSelectedItems(new Set(addressItemIds));
      setSelectedUserId(userId);
      setSelectedAddressId(addressId);
    } else if (allSelected) {
      clearAllSelections();
    } else {
      setSelectedItems(new Set(addressItemIds));
    }
  };

  const handleItemSelect = (
    itemId: string,
    userId: string,
    addressId: string,
  ) => {
    if (selectedAddressId && selectedAddressId !== addressId) return;

    const newSelectedItems = new Set(selectedItems);
    const isItemSelected = newSelectedItems.has(itemId);

    if (isItemSelected) {
      newSelectedItems.delete(itemId);
      if (newSelectedItems.size === 0) {
        clearAllSelections();
      }
    } else {
      newSelectedItems.add(itemId);
      setSelectedUserId(userId);
      setSelectedAddressId(addressId);
    }

    setSelectedItems(newSelectedItems);
  };

  const handleViewItemDetail = (item: any) => {
    setSelectedViewItem(item);
    setIsItemDetailModalOpen(true);
  };

  const filteredAndGroupedItems = Object.entries(groupedItems).reduce(
    (acc: GroupedItems, [userId, userData]) => {
      const filteredAddresses = Object.entries(userData.addresses).reduce(
        (
          addAcc: { [key: string]: { address: Address; items: Product[] } },
          [addressId, addressData],
        ) => {
          const filteredItems = addressData.items.filter((item) => {
            const matchesStatus =
              itemStatusFilter === 'All' ||
              (item.itemCampaign &&
                item.itemCampaign.status === itemStatusFilter);
            const matchesSearch =
              item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
          });

          if (filteredItems.length > 0) {
            addAcc[addressId] = {
              ...addressData,
              items: filteredItems,
            };
          }
          return addAcc;
        },
        {},
      );

      if (Object.keys(filteredAddresses).length > 0) {
        acc[userId] = {
          user: userData.user,
          addresses: filteredAddresses,
        };
      }
      return acc;
    },
    {},
  );

  // Campaign items content
  const renderCampaignItemsContent = () => (
    <>
      {selectedItems.size > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-meta-4 border-b dark:border-strokedark">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                />
              </div>
              <button
                onClick={handleConfirmSelection}
                className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
              >
                <Package className="w-5 h-5" />
                Xác nhận đã chọn ({selectedItems.size})
              </button>
              <button
                onClick={handleRejectSelection}
                className="inline-flex items-center justify-center gap-2.5 rounded-md bg-danger px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
              >
                <X className="w-5 h-5" />
                Từ chối các lựa chọn
              </button>
            </div>

            {/* Clear selection button */}
            <button
              onClick={clearAllSelections}
              className="inline-flex items-center justify-center gap-2.5 rounded-md bg-danger px-6 py-2 text-center font-medium text-white hover:bg-opacity-90"
            >
              Bỏ chọn tất cả
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {Object.entries(filteredAndGroupedItems).map(([userId, userData]) => (
          <div key={userId} className="border-b dark:border-strokedark">
            {/* User Header */}
            <div
              className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4"
              onClick={() => toggleUser(userId, userData)}
            >
              <ChevronDown
                className={`w-5 h-5 transition-transform ${
                  expandedUsers.has(userId) ? 'transform rotate-180' : ''
                }`}
              />
              <img
                src={userData.user.image}
                alt={userData.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold">{userData.user.name}</h3>
                <p className="text-sm text-gray-500">
                  {Object.values(userData.addresses).reduce(
                    (sum, addr) => sum + addr.items.length,
                    0,
                  )}{' '}
                  vật phẩm
                </p>
              </div>
            </div>

            {/* Addresses and Items */}
            {expandedUsers.has(userId) && (
              <div className="border-t dark:border-strokedark">
                {Object.entries(userData.addresses).map(
                  ([addressId, addressData]) => (
                    <div
                      key={addressId}
                      className="border-t dark:border-strokedark"
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={addressData.items.every((item) =>
                              selectedItems.has(item.id),
                            )}
                            onChange={() =>
                              toggleAddress(
                                userId,
                                addressId,
                                addressData.items,
                              )
                            }
                            disabled={
                              selectedAddressId !== null &&
                              selectedAddressId !== addressId
                            }
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-primary" />
                            <span>{addressData.address.address}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setExpandedAddresses((prev) => {
                              const newSet = new Set(prev);
                              if (newSet.has(addressId)) {
                                newSet.delete(addressId);
                              } else {
                                newSet.add(addressId);
                              }
                              return newSet;
                            });
                          }}
                          className="ml-auto"
                        >
                          <ChevronDown
                            className={`w-5 h-5 transition-transform ${
                              expandedAddresses.has(addressId)
                                ? 'transform rotate-180'
                                : ''
                            }`}
                          />
                        </button>
                      </div>

                      {/* Items Table */}
                      {expandedAddresses.has(addressId) && (
                        <div className="pl-12">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                                <th className="py-4 px-4 font-medium text-black dark:text-white w-8"></th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                  Hình ảnh
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                  Tên vật phẩm
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                  Danh mục
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                  Trạng thái
                                </th>
                                <th className="py-4 px-4 font-medium text-black dark:text-white">
                                  Hành động
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {addressData.items.map((item) => (
                                <tr
                                  key={item.id}
                                  className={`border-b dark:border-strokedark ${
                                    selectedItems.has(item.id)
                                      ? 'bg-primary/5'
                                      : 'hover:bg-gray-50 dark:hover:bg-meta-4'
                                  }`}
                                >
                                  <td className="py-4 px-4">
                                    <input
                                      type="checkbox"
                                      checked={selectedItems.has(item.id)}
                                      onChange={() =>
                                        handleItemSelect(
                                          item.id,
                                          userId,
                                          addressId,
                                        )
                                      }
                                      disabled={
                                        selectedAddressId !== null &&
                                        selectedAddressId !== addressId
                                      }
                                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                  </td>
                                  <td className="py-4 px-4">
                                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                                      <img
                                        src={item.images[0]}
                                        alt={item.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  </td>
                                  <td className="py-4 px-4">
                                    <h4 className="font-medium">{item.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {item.description}
                                    </p>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className="inline-block rounded-full px-3 py-1 text-sm bg-gray-100 dark:bg-meta-4">
                                      {item.category.name}
                                    </span>
                                  </td>
                                  <td className="py-4 px-4">
                                    {item.itemCampaign ? (
                                      <span
                                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                                          item.itemCampaign.status ===
                                          'Approved'
                                            ? 'bg-success/10 text-success'
                                            : item.itemCampaign.status ===
                                              'Pending'
                                            ? 'bg-warning/10 text-warning'
                                            : item.itemCampaign.status ===
                                              'Hold_On'
                                            ? 'bg-primary/10 text-primary'
                                            : item.itemCampaign.status ===
                                              'Requesting'
                                            ? 'bg-info/10 text-info'
                                            : item.itemCampaign.status ===
                                              'In_Transaction'
                                            ? 'bg-danger/10 text-black'
                                            : 'bg-danger/10 text-danger'
                                        }`}
                                      >
                                        {
                                          ITEM_STATUS_TRANSLATIONS[
                                            item.itemCampaign
                                              .status as ItemStatusType
                                          ]
                                        }
                                      </span>
                                    ) : (
                                      <span
                                        className={`inline-block rounded-full px-3 py-1 text-sm font-medium bg-gray-500/10 text-gray-500`}
                                      >
                                        Đã huỷ khỏi chiến dịch
                                      </span>
                                    )}
                                  </td>

                                  <td className="py-4 px-4">
                                    <div className="flex items-center space-x-3.5">
                                      <button
                                        onClick={() =>
                                          handleViewItemDetail(item)
                                        }
                                        className="hover:text-primary"
                                        title="Xem chi tiết"
                                      >
                                        <Eye className="w-5 h-5 text-blue-500" />
                                      </button>
                                      {/* ...other action buttons */}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );

  // Suggested items content
  const renderSuggestedItemsContent = () => (
    <>
      <div className="p-4 border-b dark:border-strokedark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-3">
            {selectedCampaign?.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`rounded-md px-4 py-2 text-sm ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-meta-4'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full"
            title="Làm mới"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoadingSuggested ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Người quyên góp
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Tên vật phẩm
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Hình ảnh
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Địa chỉ
                </th>

                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {suggestedItems.map((item) => (
                <tr
                  key={item.id}
                  className="border-b dark:border-strokedark hover:bg-gray-50 dark:hover:bg-meta-4"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.profilePicture || '/images/user/user-default.png'
                        }
                        alt={item.owner_Name}
                        className="w-10 h-10 rounded-full"
                      />
                      <span className="font-medium">{item.owner_Name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {item.description}
                    </p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="w-16 h-16 rounded-lg overflow-hidden">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{item.address.address}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3.5">
                      <button
                        onClick={() => handleViewItemDetail(item)}
                        className="hover:text-primary"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-5 h-5 text-blue-500" />
                      </button>
                      {/* ...other action buttons */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  return (
    <>
      <div
        className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black/50 ${
          isOpen ? '' : 'hidden'
        }`}
      >
        <div className="relative mx-auto h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white p-4 shadow-xl dark:bg-boxdark md:p-6">
          <div className="absolute inset-10 rounded-lg bg-white dark:bg-boxdark overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header with View Mode Switcher */}
              <div className="p-4 border-b dark:border-strokedark">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-xl font-semibold">
                      {viewMode === 'campaign-items'
                        ? 'Vật phẩm quyên góp'
                        : 'Vật phẩm được đề xuất'}
                    </h2>
                    {/* View Mode Switcher */}
                    <div className="flex items-center bg-gray-100 dark:bg-meta-4 rounded-lg p-1">
                      <button
                        onClick={() => onViewModeChange?.('campaign-items')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          viewMode === 'campaign-items'
                            ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-primary'
                        }`}
                      >
                        Vật phẩm quyên góp
                      </button>
                      <button
                        onClick={() => onViewModeChange?.('suggested-items')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          viewMode === 'suggested-items'
                            ? 'bg-white dark:bg-boxdark text-primary shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-primary'
                        }`}
                      >
                        Vật phẩm đề xuất
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Filter section for campaign items */}
                {viewMode === 'campaign-items' && (
                  <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex-1 min-w-[200px]">
                      <input
                        type="text"
                        placeholder="Tìm kiếm vật phẩm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      {Object.keys(ITEM_STATUS_TRANSLATIONS).map((status) => (
                        <button
                          key={status}
                          onClick={() =>
                            setItemStatusFilter(status as ItemStatusType)
                          }
                          className={`rounded-md px-4 py-2 text-sm ${
                            itemStatusFilter === status
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 dark:bg-meta-4 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {ITEM_STATUS_TRANSLATIONS[status as ItemStatusType]}
                        </button>
                      ))}

                      <button
                        onClick={handleRefreshItems}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-full transition-colors"
                        title="Làm mới"
                      >
                        <RefreshCw className="w-5 h-5 text-primary" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Content */}
              {viewMode === 'campaign-items'
                ? renderCampaignItemsContent()
                : renderSuggestedItemsContent()}
            </div>
          </div>
        </div>
      </div>

      <ItemDetailModal
        isOpen={isItemDetailModalOpen}
        onClose={() => setIsItemDetailModalOpen(false)}
        item={selectedViewItem}
        viewMode={viewMode}
        campaignId={selectedCampaign?.id}
      />

      <CampaignApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        type={approvalDialogType}
        itemIds={Array.from(selectedItems)}
        campaignId={selectedCampaign?.id || ''}
        onSuccess={() => {
          setIsApprovalDialogOpen(false);
          setSelectedItems(new Set());
          setRefreshKey((prev) => prev + 1);
        }}
      />
    </>
  );
};

export default CampaignItemsModal;
