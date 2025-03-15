import React, { useState } from 'react';
import { Campaign, CampaignDetail, CampaignItem } from '@/types/types';
import CampaignDetailModal from '@/pages/Campaign/CampaignDetail';
import {
  startCampaign,
  viewCampaignDetail,
  getCampaignItems,
  cancelCampaign,
} from '@/services/CampaignService';
import { useCampaignContext } from '@/context/CampaignContext';
import { Package, RefreshCw, Eye, Play, Trash2 } from 'lucide-react';
import CampaignItemsModal from './CampaignItemsModal';

interface CampaignTableProps {
  campaigns?: Campaign[];
  onRefresh: () => void;
}

const STATUS_TRANSLATIONS = {
  Planned: 'Đã lên kế hoạch',
  Ongoing: 'Đang diễn ra',
  Completed: 'Đã hoàn thành',
  Canceled: 'Đã hủy',
  All: 'Tất cả',
} as const;

type StatusType = keyof typeof STATUS_TRANSLATIONS;

const CampaignTable: React.FC<CampaignTableProps> = ({
  campaigns = [],
  onRefresh,
}) => {
  const {
    statusFilter,
    showModal,
    selectedCampaignId,
    selectedCampaign,
    isModalOpen,
    setStatusFilter,
    setShowModal,
    setSelectedCampaignId,
    setSelectedCampaign,
    setIsModalOpen,
  } = useCampaignContext();

  const [isItemsModalOpen, setIsItemsModalOpen] = useState(false);
  const [campaignItems, setCampaignItems] = useState<CampaignItem[]>([]);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [campaignToCancel, setCampaignToCancel] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<
    'campaign-items' | 'suggested-items'
  >('campaign-items');

  const statusCounts = campaigns.reduce<Record<string, number>>(
    (acc, campaign) => {
      acc[campaign.status] = (acc[campaign.status] || 0) + 1;
      return acc;
    },
    {},
  );

  const filteredCampaigns =
    statusFilter === 'All'
      ? campaigns
      : campaigns.filter((campaign) => campaign.status === statusFilter);

  const refreshCampaignItems = async (campaignId: string) => {
    try {
      const itemsResponse = await getCampaignItems(campaignId);
      if (itemsResponse.isSuccess) {
        setCampaignItems(itemsResponse.data.data);
      }
    } catch (error) {
      console.error('Error refreshing campaign items:', error);
    }
  };

  const handleViewCampaign = async (campaignId: string) => {
    const response = await viewCampaignDetail(campaignId);
    if (response.isSuccess && response.data?.data) {
      setSelectedCampaign(response.data.data);
      setIsModalOpen(true);
    }
  };

  const handleStartCampaign = () => {
    startCampaign(selectedCampaignId!, setShowModal, onRefresh);
  };

  const handleCancelClick = (campaignId: string) => {
    setCampaignToCancel(campaignId);
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    if (campaignToCancel) {
      await cancelCampaign(campaignToCancel, setShowCancelModal, onRefresh);
      setCampaignToCancel(null);
    }
  };

  const handleViewItems = async (campaignId: string) => {
    try {
      // Fetch campaign details
      const campaignResponse = await viewCampaignDetail(campaignId);

      if (campaignResponse.isSuccess && campaignResponse.data?.data) {
        const campaignData = campaignResponse.data.data;
        console.log('Campaign Data:', campaignData);
        setSelectedCampaign(campaignData);

        // Fetch items
        const itemsResponse = await getCampaignItems(campaignId);
        if (itemsResponse.isSuccess) {
          setCampaignItems(itemsResponse.data.data);
        }
        setIsItemsModalOpen(true);
      } else {
        console.error('Failed to fetch campaign details');
      }
    } catch (error) {
      console.error('Error in handleViewItems:', error);
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-6 flex items-center justify-between">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Danh sách chiến dịch
        </h4>
        <button
          onClick={onRefresh}
          className="inline-flex items-center justify-center gap-2.5 rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90"
        >
          <RefreshCw size={20} />
          Làm mới
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <button
          onClick={() => setStatusFilter('All')}
          className={`rounded-md px-4 py-2 text-sm ${
            statusFilter === 'All'
              ? 'bg-primary text-white'
              : 'bg-gray-100 dark:bg-boxdark'
          }`}
        >
          {STATUS_TRANSLATIONS['All']} ({campaigns.length})
        </button>
        {['Planned', 'Ongoing', 'Completed', 'Canceled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`rounded-md px-4 py-2 text-sm ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-boxdark'
            }`}
          >
            {STATUS_TRANSLATIONS[status as StatusType]} (
            {statusCounts[status] || 0})
          </button>
        ))}
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                Tên chiến dịch
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Ngày bắt đầu
              </th>
              <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                Ngày kết thúc
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Trạng thái
              </th>
              <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                Vật phẩm
              </th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map((campaign) => (
              <tr key={campaign.id}>
                <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                  <h5 className="font-medium text-black dark:text-white">
                    {campaign.name}
                  </h5>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {new Date(campaign.startDate).toLocaleDateString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p className="text-black dark:text-white">
                    {new Date(campaign.endDate).toLocaleDateString()}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <p
                    className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${
                      {
                        Planned: 'bg-warning/10 text-warning',
                        Ongoing: 'bg-success/10 text-success',
                        Canceled: 'bg-danger/10 text-danger',
                        Completed: 'bg-primary/10 text-primary',
                      }[campaign.status] || 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {STATUS_TRANSLATIONS[campaign.status as StatusType]}
                  </p>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center gap-2">
                    {campaign.itemCampaigns > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-2 h-2 bg-green-500 rounded-full"></span>
                        <span className="text-sm text-green-500 font-medium">
                          {campaign.itemCampaigns}
                        </span>
                      </div>
                    )}
                    {campaign.pendingItemCampaigns > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-2 h-2 bg-yellow-500 rounded-full"></span>
                        <span className="text-sm text-yellow-500 font-medium">
                          {campaign.pendingItemCampaigns}
                        </span>
                      </div>
                    )}
                    {campaign.itemCampaigns === 0 &&
                      campaign.pendingItemCampaigns === 0 && (
                        <span className="text-sm text-gray-400">Chưa có</span>
                      )}
                  </div>
                </td>
                <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                  <div className="flex items-center space-x-4">
                    {/* View Details Button */}
                    <button
                      className="hover:text-primary transition-colors duration-200"
                      onClick={() => handleViewCampaign(campaign.id)}
                      title="Xem chi tiết"
                    >
                      <Eye className="h-5 w-5 text-blue-500 hover:text-blue-600" />
                    </button>

                    {/* View Items Button */}
                    <button
                      className="hover:text-primary transition-colors duration-200"
                      onClick={() => handleViewItems(campaign.id)}
                      title="Xem vật phẩm"
                    >
                      <Package className="h-5 w-5 text-blue-500 hover:text-blue-600" />
                    </button>

                    {/* Start Campaign Button */}
                    <button
                      className={`transition-colors duration-200 ${
                        ['Planned', 'Canceled'].includes(campaign.status)
                          ? 'hover:text-primary'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (['Planned', 'Canceled'].includes(campaign.status)) {
                          setSelectedCampaignId(campaign.id);
                          setShowModal(true);
                        }
                      }}
                      disabled={
                        !['Planned', 'Canceled'].includes(campaign.status)
                      }
                      title="Bắt đầu chiến dịch"
                    >
                      <Play className="h-5 w-5 text-emerald-500" />
                    </button>

                    {/* Cancel Campaign Button */}
                    <button
                      className={`transition-colors duration-200 ${
                        campaign.status !== 'Completed'
                          ? 'hover:text-primary'
                          : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() =>
                        campaign.status !== 'Completed' &&
                        handleCancelClick(campaign.id)
                      }
                      disabled={campaign.status === 'Completed'}
                      title="Hủy chiến dịch"
                    >
                      <Trash2 className="h-5 w-5 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Campaign Items Modal */}
      <CampaignItemsModal
        isOpen={isItemsModalOpen}
        onClose={() => setIsItemsModalOpen(false)}
        items={campaignItems}
        viewMode={viewMode}
        selectedCampaign={selectedCampaign as CampaignDetail}
        onRefresh={refreshCampaignItems}
        onViewModeChange={(mode) => setViewMode(mode)}
      />

      {/* Confirmation Modals */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-boxdark p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Xác nhận bắt đầu chiến dịch
            </h3>
            <p className="mb-6">Có chắc chắn bắt đầu chiến dịch này không?</p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-200 dark:bg-gray-700 hover:bg-opacity-90 px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Không
              </button>
              <button
                className="bg-primary text-white px-4 py-2 rounded"
                onClick={handleStartCampaign}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-boxdark p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">
              Xác nhận hủy chiến dịch
            </h3>
            <p className="mb-6">Có chắc chắn muốn hủy chiến dịch này không?</p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-gray-200 dark:bg-gray-700 hover:bg-opacity-90 px-4 py-2 rounded"
                onClick={() => setShowCancelModal(false)}
              >
                Không
              </button>
              <button
                className="bg-danger text-white px-4 py-2 rounded"
                onClick={handleConfirmCancel}
              >
                Có
              </button>
            </div>
          </div>
        </div>
      )}

      <CampaignDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        campaign={selectedCampaign as CampaignDetail}
      />
    </div>
  );
};

export default CampaignTable;
