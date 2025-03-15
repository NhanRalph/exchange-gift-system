import React, { useEffect, useState } from 'react';
import { MapPin, Gift, Package, Tag, Clock, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

import {
  approveItem,
  rejectItem,
  addItemToCampaign,
  getRequestItemCampaign,
  getAvailableVolunteers,
  getSuggestedAppointments,
} from '@/services/CampaignService';
import toast from 'react-hot-toast';
import { useRefresh } from '@/context/RefreshContext';
import { formatAvailableTime } from '@/utils/format-date';
import { SuggestedAppointment } from '@/types/types';

interface ItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onRefresh?: () => void;
  viewMode?: 'campaign-items' | 'suggested-items';
  campaignId?: string;
}

const translateCondition = (condition: string): string => {
  const conditionMap: Record<string, string> = {
    Used: 'Đã sử dụng',
    New: 'Mới',
  };
  return conditionMap[condition] || condition;
};

const translateGift = (isGift: boolean): string => {
  return isGift ? 'Có' : 'Không';
};

const rejectReasons = [
  { value: 'inappropriate_content', label: 'Nội dung không phù hợp' },
  { value: 'poor_quality', label: 'Chất lượng kém' },
  { value: 'duplicate_item', label: 'Sản phẩm trùng lặp' },
  { value: 'wrong_category', label: 'Sai danh mục' },
  { value: 'other', label: 'Lý do khác' },
];

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onRefresh,
  viewMode,
  campaignId,
}) => {
  const { triggerRefresh } = useRefresh();
  const [isApproveDialogOpen, setIsApproveDialogOpen] =
    useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [requestItemCampaign, setRequestItemCampaign] = useState<any>();
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [appointmentDateSuggestion, setAppointmentDateSuggestion] =
    useState('');

  const [suggestedAppointments, setSuggestedAppointments] = useState<
    SuggestedAppointment[]
  >([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(
    null,
  );

  const [availableVolunteers, setAvailableVolunteers] = useState<
    Array<{
      id: string;
      name: string;
      image: string;
    }>
  >([]);

  useEffect(() => {
    if (!isOpen) {
      setIsApproveDialogOpen(false);
      setSelectedVolunteer('');
      setAppointmentDate('');
      setVolunteers([]);
    }
  }, [isOpen]);

  const fetchSuggestedAppointments = async () => {
    if (!item?.address?.addressId) return;

    setLoadingSuggestions(true);
    try {
      const response = await getSuggestedAppointments(item.address.addressId);
      if (response.isSuccess) {
        setSuggestedAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching suggested appointments:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchRequestItemCampaign = async () => {
    try {
      // Only call the API if requestIdOfItemCampaign exists
      if (item?.requestIdOfItemCampaign) {
        const response = await getRequestItemCampaign(
          item.requestIdOfItemCampaign,
        );
        if (response.isSuccess) {
          console.log('Request Item Campaign:', response.data);
          setRequestItemCampaign(response.data);
        }
      } else {
        // Reset the state if there's no request ID
        setRequestItemCampaign(null);
      }
    } catch (error) {
      console.error('Error fetching request item campaign:', error);
      // Reset the state on error
      setRequestItemCampaign(null);
    }
  };

  useEffect(() => {
    fetchRequestItemCampaign();
  }, []);

  const handleApproveClick = async () => {
    setIsApproveDialogOpen(true);
    await fetchSuggestedAppointments();
  };

  const handleApproveConfirm = async () => {
    if (!selectedVolunteer || !appointmentDate) return;

    setLoading(true);
    try {
      const dateObj = new Date(appointmentDate);

      // Định dạng lại ngày tháng và giờ theo yêu cầu
      const formattedDate =
        dateObj.getFullYear() +
        '-' +
        ('0' + (dateObj.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + dateObj.getDate()).slice(-2) +
        ' ' +
        ('0' + dateObj.getHours()).slice(-2) +
        ':' +
        ('0' + dateObj.getMinutes()).slice(-2) +
        ':' +
        ('0' + dateObj.getSeconds()).slice(-2);

      await approveItem({
        itemIds: [item.id],
        volunteerId: selectedVolunteer,
        appointmentDate: formattedDate,
        campaignId: campaignId,
      });

      triggerRefresh();
      setIsApproveDialogOpen(false);
      onClose();
      onRefresh?.();
    } catch (error) {
      console.error('Error approving item:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().slice(0, 16);
  };

  const handleReject = async () => {
    setIsRejectDialogOpen(true);
  };

  const confirmReject = async () => {
    if (!rejectReason) {
      toast.error('Vui lòng chọn lý do từ chối');
      return;
    }

    setLoading(true);
    try {
      await rejectItem({
        itemIds: [item.id],
        campaignId: item.itemCampaign.campaignId,
        rejectMessage: rejectReason,
      });
      setIsRejectDialogOpen(false);
      onClose();
      onRefresh?.();
    } catch (error) {
      console.error('Error rejecting item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAddItemCampaign = async () => {
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmAdd = async () => {
    try {
      if (!campaignId) {
        toast.error('Campaign ID is required');
        return;
      }

      if (!appointmentDateSuggestion) {
        toast.error('Vui lòng chọn ngày hẹn');
        return;
      }

      const dateObj = new Date(appointmentDateSuggestion);

      // Định dạng lại ngày tháng và giờ theo yêu cầu
      const formattedDate =
        dateObj.getFullYear() +
        '-' +
        ('0' + (dateObj.getMonth() + 1)).slice(-2) +
        '-' +
        ('0' + dateObj.getDate()).slice(-2) +
        ' ' +
        ('0' + dateObj.getHours()).slice(-2) +
        ':' +
        ('0' + dateObj.getMinutes()).slice(-2) +
        ':' +
        ('0' + dateObj.getSeconds()).slice(-2);

      setIsSubmitting(true);
      await addItemToCampaign([item.id], campaignId, formattedDate);
      setIsConfirmDialogOpen(false);

      toast.success('Tạo yêu cầu thêm sản phẩm thành công!');
      triggerRefresh();
    } catch (error) {
      toast.error('Có lỗi xảy ra khi thêm sản phẩm!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDateChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setAppointmentDate(newDate);
    setSelectedSuggestion(null);
    setSelectedVolunteer('');

    if (newDate) {
      try {
        const response = await getAvailableVolunteers(
          newDate,
          item.address.addressId,
        );
        if (response.isSuccess) {
          setAvailableVolunteers(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching available volunteers:', error);
        setAvailableVolunteers([]);
      }
    }
  };

  const handleSuggestionSelect = (suggestion: SuggestedAppointment) => {
    setAppointmentDate(suggestion.date);
    setSelectedVolunteer(suggestion.volunteer.id);
    setSelectedSuggestion(suggestion.volunteer.id);
  };

  if (!isOpen || !item) return null;

  return (
    <>
      <div className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-black/50">
        <div className="relative mx-auto h-[90vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white p-4 shadow-xl dark:bg-boxdark md:p-6">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-50 rounded-full bg-white/10 p-2 text-gray-500 backdrop-blur-sm transition-colors hover:bg-gray-100 hover:text-gray-700"
          >
            <svg
              className="h-6 w-6"
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

          {/* Scrollable Content */}
          <div className="h-full overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col gap-6">
              {/* Image Gallery */}
              <div className="relative h-48 w-full overflow-hidden rounded-xl md:h-64">
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <h1 className="text-2xl font-bold text-white md:text-3xl">
                    {item.name}
                  </h1>
                </div>
              </div>

              {/* Status & Basic Info */}
              <div className="grid grid-cols-1 gap-6 px-2 md:grid-cols-2">
                <div className="space-y-4">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">
                        Tình trạng:{' '}
                        <span className="font-medium">
                          {translateCondition(item.condition)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">
                        Quà tặng:{' '}
                        <span className="font-medium">
                          {translateGift(item.isGift)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-5 w-5 text-gray-500" />
                      <span className="text-sm">
                        Danh mục:{' '}
                        <span className="font-medium">
                          {item.category.name}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Owner Info */}
                  <div className="flex items-center gap-3">
                    <img
                      src={item.profilePicture}
                      alt={item.owner_Name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-medium">{item.owner_Name}</p>
                      <p className="text-xs text-gray-500">Chủ sở hữu</p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">
                      Địa chỉ: {item.address.address}
                    </span>
                  </div>

                  {/* Available Time */}
                  <div className="flex items-start gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <span className="text-sm">
                      Thời gian rảnh: {formatAvailableTime(item.availableTime)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="px-2">
                <h3 className="text-base font-bold text-black dark:text-gray-400">
                  Mô tả chi tiết
                </h3>
                <p className="mt-2 text-sm text-gray-900 dark:text-white">
                  {item.description}
                </p>
              </div>

              {/* Campaign Info if exists */}
              {item.itemCampaign && (
                <div className="px-2">
                  <h3 className="mb-3 text-base font-bold text-black dark:text-gray-400">
                    Chiến dịch liên quan
                  </h3>
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={item.itemCampaign.bannerPicture}
                        alt={item.itemCampaign.name}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-medium">
                          {item.itemCampaign.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {new Date(
                            item.itemCampaign.startDate,
                          ).toLocaleDateString()}{' '}
                          -
                          {new Date(
                            item.itemCampaign.endDate,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Information Section */}
              {requestItemCampaign && (
                <div className="px-2">
                  <h3 className="mb-4 text-base font-bold text-black dark:text-gray-400">
                    Thông tin yêu cầu
                  </h3>

                  <div className="space-y-6 rounded-lg border border-stroke p-4 dark:border-strokedark">
                    {/* Status and Timestamp */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-medium
          ${
            requestItemCampaign.status === 'Approved'
              ? 'bg-success/10 text-success'
              : requestItemCampaign.status === 'Rejected'
              ? 'bg-danger/10 text-danger'
              : 'bg-warning/10 text-warning'
          }`}
                      >
                        {requestItemCampaign.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(
                          requestItemCampaign.createdAt,
                        ).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {/* Request Message */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-black dark:text-white">
                        Nội dung yêu cầu
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {requestItemCampaign.requestMessage}
                      </p>
                    </div>

                    {/* Participants */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Donor */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-black dark:text-white">
                          Người cho
                        </h4>
                        <div className="flex items-center gap-2">
                          <img
                            src={requestItemCampaign.charitarian.image}
                            alt={requestItemCampaign.charitarian.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="text-sm">
                            {requestItemCampaign.charitarian.name}
                          </span>
                        </div>
                      </div>

                      {/* Volunteer */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-black dark:text-white">
                          Tình nguyện viên
                        </h4>
                        <div className="flex items-center gap-2">
                          <img
                            src={requestItemCampaign.requester.image}
                            alt={requestItemCampaign.requester.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <span className="text-sm">
                            {requestItemCampaign.requester.name}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment Date */}
                    {requestItemCampaign.appointmentDate &&
                      requestItemCampaign.appointmentDate.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-black dark:text-white">
                            Ngày hẹn
                          </h4>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {new Date(
                                requestItemCampaign.appointmentDate[0],
                              ).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      )}

                    {/* Reject Message if exists */}
                    {requestItemCampaign.rejectMessage && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-danger">
                          Lý do từ chối
                        </h4>
                        <p className="text-sm text-danger">
                          {requestItemCampaign.rejectMessage}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 mt-6 flex justify-end gap-4 border-t bg-white p-4 dark:bg-boxdark">
              {viewMode === 'campaign-items' &&
              item?.itemCampaign?.status === 'Pending' ? (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={loading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Từ chối
                  </Button>
                  <Button
                    variant="default"
                    onClick={handleApproveClick}
                    disabled={loading}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Phê duyệt
                  </Button>
                </>
              ) : viewMode === 'suggested-items' ? (
                <Button
                  variant="default"
                  onClick={handleConfirmAddItemCampaign}
                  disabled={loading}
                >
                  <Check className="mr-2 h-4 w-4" />
                  Thêm vào chiến dịch
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      {isApproveDialogOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chọn tình nguyện viên</h2>
              <button
                onClick={() => setIsApproveDialogOpen(false)}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Suggested Appointments Section */}
              <div className="space-y-3">
                <label className="mb-2 block text-sm font-medium">
                  Ngày hẹn gợi ý
                </label>
                {loadingSuggestions ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : suggestedAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {suggestedAppointments.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
                      >
                        <img
                          src={suggestion.volunteer.image}
                          alt={suggestion.volunteer.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {suggestion.volunteer.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(suggestion.date).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        <input
                          type="radio"
                          checked={
                            selectedSuggestion === suggestion.volunteer.id
                          }
                          onChange={() => {}}
                          className="h-4 w-4"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Không có gợi ý nào</p>
                )}
              </div>

              {/* Custom Date Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Hoặc chọn ngày hẹn khác
                </label>
                <input
                  type="datetime-local"
                  className={`w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark ${
                    !appointmentDate ||
                    new Date(appointmentDate) > new Date(getMaxDate())
                      ? 'cursor-not-allowed opacity-50'
                      : ''
                  }`}
                  value={appointmentDate}
                  onChange={handleDateChange}
                  min={new Date().toISOString().slice(0, 16)}
                  max={getMaxDate()}
                />
                <p className="mt-1 text-xs text-gray-500">
                  * Chỉ được chọn trong vòng 7 ngày kể từ hiện tại
                </p>
              </div>

              {/* Volunteer Selection */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Chọn tình nguyện viên
                </label>
                <select
                  className={`w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark ${
                    !appointmentDate ? 'cursor-not-allowed opacity-50' : ''
                  }`}
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                  disabled={!appointmentDate}
                >
                  <option value="">Chọn tình nguyện viên</option>
                  {selectedSuggestion
                    ? // Show suggested volunteer if a suggestion is selected
                      suggestedAppointments
                        .filter((s) => s.volunteer.id === selectedSuggestion)
                        .map((s) => (
                          <option key={s.volunteer.id} value={s.volunteer.id}>
                            {s.volunteer.name}
                          </option>
                        ))
                    : // Show available volunteers for custom date
                      availableVolunteers.map((volunteer) => (
                        <option key={volunteer.id} value={volunteer.id}>
                          {volunteer.name}
                        </option>
                      ))}
                </select>
                {appointmentDate &&
                  !selectedSuggestion &&
                  availableVolunteers.length === 0 && (
                    <p className="mt-2 text-sm text-danger">
                      Không có tình nguyện viên rảnh vào thời gian này
                    </p>
                  )}
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setIsApproveDialogOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="default"
                  onClick={handleApproveConfirm}
                  disabled={loading || !selectedVolunteer || !appointmentDate}
                >
                  Chấp nhận
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {isRejectDialogOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-medium">
              Xác nhận từ chối sản phẩm này
            </h3>
            <p className="mb-4">Bạn có chắc chắn từ chối sản phẩm này?</p>

            {/* Select Dropdown */}
            <div className="mb-6">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Lý do từ chối
              </label>
              <div className="relative">
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-lg border border-stroke bg-transparent py-2 pl-6 pr-10 outline-none focus:border-primary focus-visible:shadow-none dark:border-form-strokedark dark:bg-form-input dark:focus:border-primary"
                  required
                >
                  <option value="">Chọn lý do</option>
                  {rejectReasons.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsRejectDialogOpen(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={confirmReject}
                className="rounded-lg bg-danger px-4 py-2 text-white hover:bg-danger/90"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Add Item to Campaign */}
      {isConfirmDialogOpen && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark">
            <h3 className="mb-4 text-xl font-bold">Xác nhận thêm sản phẩm</h3>
            <p className="mb-6">
              Bạn có chắc chắn muốn thêm sản phẩm này vào chiến dịch?
            </p>

            <div>
              <label className="mb-2 block text-sm font-medium">Ngày hẹn</label>
              <input
                type="datetime-local"
                className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                value={appointmentDateSuggestion}
                onChange={(e) => setAppointmentDateSuggestion(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setIsConfirmDialogOpen(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                variant="default"
                onClick={handleConfirmAdd}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Có'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ItemDetailModal;
