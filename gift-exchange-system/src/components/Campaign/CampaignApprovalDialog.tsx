import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import {
  getVolunteers,
  approveItem,
  rejectItem,
} from '@/services/CampaignService';

const rejectReasons = [
  { value: 'inappropriate_content', label: 'Nội dung không phù hợp' },
  { value: 'poor_quality', label: 'Chất lượng kém' },
  { value: 'duplicate_item', label: 'Sản phẩm trùng lặp' },
  { value: 'wrong_category', label: 'Sai danh mục' },
  { value: 'other', label: 'Lý do khác' },
];

interface CampaignApprovalDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'approve' | 'reject';
  itemIds: string[];
  campaignId: string;
  onSuccess?: () => void;
}

const CampaignApprovalDialog: React.FC<CampaignApprovalDialogProps> = ({
  isOpen,
  onClose,
  type,
  itemIds,
  campaignId,
  onSuccess,
}) => {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && type === 'approve') {
      fetchVolunteers();
    }
  }, [isOpen, type]);

  const fetchVolunteers = async () => {
    try {
      const response = await getVolunteers();
      if (response.data) {
        setVolunteers(response.data);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  };

  const handleApproveConfirm = async () => {
    if (!selectedVolunteer || !appointmentDate) return;

    setLoading(true);
    try {
      const dateObj = new Date(appointmentDate);
      const formattedDate = dateObj.toISOString().slice(0, 19);

      await approveItem({
        itemIds: itemIds,
        volunteerId: selectedVolunteer,
        appointmentDate: formattedDate,
        campaignId: campaignId,
      });

      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error approving items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason) return;

    setLoading(true);
    try {
      // Since reject API only handles one item at a time, we need to call it for each item
      await rejectItem({
        itemIds: itemIds,
        campaignId,
        rejectMessage: rejectReason,
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      console.error('Error rejecting items:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-boxdark">
        {type === 'approve' ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Chọn tình nguyện viên</h2>
              <button
                onClick={onClose}
                className="rounded-full p-1 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Ngày hẹn
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Chọn tình nguyện viên
                </label>
                <select
                  className="w-full rounded-lg border border-stroke bg-transparent px-4 py-2 outline-none focus:border-primary dark:border-strokedark"
                  value={selectedVolunteer}
                  onChange={(e) => setSelectedVolunteer(e.target.value)}
                  disabled={!appointmentDate}
                >
                  <option value="">Chọn tình nguyện viên</option>
                  {volunteers.map((volunteer) => (
                    <option key={volunteer.userId} value={volunteer.userId}>
                      {volunteer.username}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button
                  variant="default"
                  onClick={handleApproveConfirm}
                  disabled={loading || !selectedVolunteer || !appointmentDate}
                >
                  Xác nhận
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="mb-4 text-xl font-medium">
              Xác nhận từ chối {itemIds.length} sản phẩm
            </h3>

            <div className="mb-6">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                Lý do từ chối
              </label>
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

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectConfirm}
                disabled={loading || !rejectReason}
              >
                Xác nhận từ chối
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CampaignApprovalDialog;
