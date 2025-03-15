import { useEffect, useState } from 'react';
import {
  fetchCampaigns,
  fetchCampaignTransactions,
  getVolunteers,
  assignVolunteer,
  getSuggestedAppointments,
  getAvailableVolunteers,
  fetchCampaignRequests,
  cancelCampaignRequest,
} from '@/services/CampaignService';
import { Campaign, Transaction } from '@/types/types';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/format-date';
import { getStatusColor, STATUS_TRANSLATIONS } from '@/utils/status-translate';

const TransactionTable = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[] | any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingVolunteer, setIsLoadingVolunteer] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string>('');
  const [volunteerFilter, setVolunteerFilter] = useState<
    'all' | 'with' | 'without'
  >('all');
  const [viewMode, setViewMode] = useState<'transactions' | 'requests'>(
    'transactions',
  );
  const [showDeleteRequestConfirm, setShowDeleteRequestConfirm] =
    useState(false);
  const [selectedRequest, setSelectedRequest] = useState<Transaction | null>(
    null,
  );
  const itemsPerPage = 10;

  useEffect(() => {
    // Initial fetch of campaigns
    const initData = async () => {
      try {
        await fetchCampaigns((data) => {
          setCampaigns(data);
          if (data.length > 0) {
            setCampaignId(data[0].id);
          }
        });
      } catch (err) {
        setError('Failed to load campaigns');
        console.error(err);
      }
    };
    initData();
  }, []);

  useEffect(() => {
    if (campaignId) {
      fetchData();
    }
  }, [campaignId, viewMode]);

  const fetchData = async () => {
    if (!campaignId) return;

    try {
      setLoading(true);
      let response;

      if (viewMode === 'transactions') {
        response = await fetchCampaignTransactions(campaignId);
      } else {
        response = await fetchCampaignRequests(campaignId);
      }

      setTransactions(response.data.data || []);
    } catch (err) {
      setError(`Failed to load ${viewMode}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableVolunteers = async (transaction: Transaction) => {
    try {
      // Reset volunteers list before fetching
      setVolunteers([]);

      if (transaction.charitarianAddress?.addressId) {
        const suggestedResponse = await getSuggestedAppointments(
          transaction.charitarianAddress.addressId,
        );

        if (
          suggestedResponse?.isSuccess &&
          Array.isArray(suggestedResponse.data) &&
          suggestedResponse.data.length > 0
        ) {
          const volunteers = suggestedResponse.data.map((suggestion: any) => ({
            userId: suggestion.volunteer?.id,
            fullName: suggestion.volunteer?.name,
            address: [{ address: 'Suggested volunteer' }],
          }));
          setVolunteers(volunteers);
          return;
        }
      }

      // Fallback to getting all available volunteers
      const availableResponse = await getAvailableVolunteers(
        transaction.appointmentDate,
        transaction.charitarianAddress?.addressId || '',
      );

      if (availableResponse?.isSuccess) {
        // Ensure data is an array before setting
        const volunteerData = Array.isArray(availableResponse.data)
          ? availableResponse.data
          : [];
        setVolunteers(volunteerData);
      } else {
        setVolunteers([]);
      }
    } catch (err) {
      console.error('Error fetching volunteers:', err);
      setVolunteers([]); // Set empty array on error
      setErrorMessage('Lỗi khi tải danh sách tình nguyện viên');
      setShowErrorDialog(true);
    }
  };

  const handleCampaignChange = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    setCampaignId(event.target.value);
  };

  const isInProgress = (status: string) => {
    return status.toLowerCase() === 'in_progress';
  };

  const isWithinSevenDays = (appointmentDate: string) => {
    if (!appointmentDate) return false;

    // Kiểm tra xem appointmentDate có phải là mảng không
    const dateToCheck = Array.isArray(appointmentDate)
      ? appointmentDate[0]
      : appointmentDate;

    const now = new Date();
    const appointment = new Date(dateToCheck);

    // Đặt thời gian về 00:00:00 cho cả hai ngày để so sánh chính xác
    now.setHours(0, 0, 0, 0);
    appointment.setHours(0, 0, 0, 0);

    const diffTime = appointment.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 7 && diffDays >= 0;
  };

  const handleViewTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowModal(true);
  };

  const handleAddVolunteer = async (transaction: Transaction) => {
    try {
      console.log('Transaction:', transaction);
      setIsLoadingVolunteer(true);

      if (!transaction || !transaction.appointmentDate) {
        console.log('No appointment date found');
        setErrorMessage('Không tìm thấy thông tin ngày hẹn.');
        setShowErrorDialog(true);
        return;
      }

      // Handle array or string appointment date
      const appointmentDate = Array.isArray(transaction.appointmentDate)
        ? transaction.appointmentDate[0]
        : transaction.appointmentDate;

      console.log('Appointment date:', appointmentDate);

      if (!isWithinSevenDays(appointmentDate)) {
        console.log('Not within 7 days');
        setErrorMessage('Chỉ được thêm tình nguyện viên trong vòng 1 tuần.');
        setShowErrorDialog(true);
        return;
      }

      setSelectedTransaction(transaction);

      // Add error handling for fetchAvailableVolunteers
      try {
        await fetchAvailableVolunteers(transaction);
        setShowVolunteerModal(true);
      } catch (err) {
        console.error('Error fetching volunteers:', err);
        setErrorMessage('Lỗi khi tải danh sách tình nguyện viên.');
        setShowErrorDialog(true);
        return;
      }
    } catch (err) {
      console.error('Error in handleAddVolunteer:', err);
      setErrorMessage('Đã xảy ra lỗi khi thêm tình nguyện viên.');
      setShowErrorDialog(true);
    } finally {
      setIsLoadingVolunteer(false);
    }
  };

  const handleVolunteerAssignment = async () => {
    if (!selectedTransaction || !selectedVolunteer) return;

    try {
      await assignVolunteer(selectedTransaction.id, selectedVolunteer);
      setShowVolunteerModal(false);
      setSelectedVolunteer('');
      fetchData();
    } catch (err) {
      console.error('Failed to assign volunteer:', err);
    }
  };

  const handleDeleteRequest = (request: Transaction) => {
    setSelectedRequest(request);
    setShowDeleteRequestConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedRequest) return;

    try {
      await cancelCampaignRequest(selectedRequest.id);
      setShowDeleteRequestConfirm(false);
      fetchData();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  useEffect(() => {
    const loadVolunteers = async () => {
      try {
        const response = await getVolunteers();
        if (response?.isSuccess) {
          setVolunteers(response?.data);
        }
      } catch (err) {
        console.error('Failed to load volunteers:', err);
      }
    };
    loadVolunteers();
  }, []);

  const LoadingSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-12 w-[220px]" />
          <Skeleton className="h-12 w-[150px]" />
          <Skeleton className="h-12 w-[150px]" />
          <Skeleton className="h-12 w-[120px]" />
          <Skeleton className="h-12 w-[100px]" />
        </div>
      ))}
    </div>
  );

  const getFilteredTransactions = (transactions: Transaction[]) => {
    switch (volunteerFilter) {
      case 'with':
        return transactions.filter((t) => t.volunteer);
      case 'without':
        return transactions.filter((t) => !t.volunteer);
      default:
        return transactions;
    }
  };

  const filteredTransactions = getFilteredTransactions(transactions);
  const paginatedTransactions = filteredTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const translateStatus = (status: string) => {
    return (
      STATUS_TRANSLATIONS[status as keyof typeof STATUS_TRANSLATIONS] || status
    );
  };

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <select
            className="w-64 rounded-lg border border-stroke bg-white px-4 py-2 dark:border-strokedark dark:bg-boxdark"
            value={campaignId || ''}
            onChange={handleCampaignChange}
          >
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('transactions')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'transactions'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Đóng góp
            </button>
            <button
              onClick={() => setViewMode('requests')}
              className={`px-4 py-2 rounded-lg ${
                viewMode === 'requests'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Yêu cầu
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setVolunteerFilter('all')}
              className={`px-4 py-2 rounded-lg ${
                volunteerFilter === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setVolunteerFilter('with')}
              className={`px-4 py-2 rounded-lg ${
                volunteerFilter === 'with'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Có TNV
            </button>
            <button
              onClick={() => setVolunteerFilter('without')}
              className={`px-4 py-2 rounded-lg ${
                volunteerFilter === 'without'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Chưa có TNV
            </button>
          </div>
        </div>

        <button
          onClick={fetchData}
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Làm mới
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger bg-opacity-10 p-4 text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : transactions.length === 0 ? (
        <div className="flex justify-center py-8 text-gray-500">
          No transactions found
        </div>
      ) : (
        <>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[220px] py-4 px-4 font-medium text-black dark:text-white xl:pl-11">
                    {viewMode === 'transactions'
                      ? 'Người yêu cầu'
                      : 'Người tặng'}
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    {viewMode === 'transactions'
                      ? 'Người tặng'
                      : 'Sản phẩm tặng'}
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    {viewMode === 'transactions'
                      ? 'Sản phẩm tặng'
                      : 'Thời gian hẹn'}
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Trạng thái
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((item, key) => (
                  <tr key={key}>
                    <td className="border-b border-[#eee] py-5 px-4 pl-9 dark:border-strokedark xl:pl-11">
                      <h5 className="font-medium text-black dark:text-white">
                        {viewMode === 'transactions'
                          ? item.requester?.name
                          : item.charitarian?.name}
                      </h5>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {viewMode === 'transactions'
                          ? item.charitarian?.name
                          : item.charitarianItem?.itemName}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {viewMode === 'transactions'
                          ? item.charitarianItem?.itemName
                          : formatDate(item.appointmentDate[0])}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p
                        className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${getStatusColor(
                          item.status,
                        )}`}
                      >
                        {translateStatus(item.status)}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <Tooltip>
                          <button
                            className="hover:text-primary"
                            onClick={() => handleViewTransaction(item)}
                          >
                            <svg
                              className="fill-current"
                              width="18"
                              height="18"
                              viewBox="0 0 18 18"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                d="M8.99981 14.8219C3.43106 14.8219 0.674805 9.50624 0.562305 9.28124C0.47793 9.11249 0.47793 8.88749 0.562305 8.71874C0.674805 8.49374 3.43106 3.20624 8.99981 3.20624C14.5686 3.20624 17.3248 8.49374 17.4373 8.71874C17.5217 8.88749 17.5217 9.11249 17.4373 9.28124C17.3248 9.50624 14.5686 14.8219 8.99981 14.8219ZM1.85605 8.99999C2.4748 10.0406 4.89356 13.5562 8.99981 13.5562C13.1061 13.5562 15.5248 10.0406 16.1436 8.99999C15.5248 7.95936 13.1061 4.44374 8.99981 4.44374C4.89356 4.44374 2.4748 7.95936 1.85605 8.99999Z"
                                fill=""
                              />
                              <path
                                d="M9 11.3906C7.67812 11.3906 6.60938 10.3219 6.60938 9C6.60938 7.67813 7.67812 6.60938 9 6.60938C10.3219 6.60938 11.3906 7.67813 11.3906 9C11.3906 10.3219 10.3219 11.3906 9 11.3906ZM9 7.875C8.38125 7.875 7.875 8.38125 7.875 9C7.875 9.61875 8.38125 10.125 9 10.125C9.61875 10.125 10.125 9.61875 10.125 9C10.125 8.38125 9.61875 7.875 9 7.875Z"
                                fill=""
                              />
                            </svg>
                          </button>
                        </Tooltip>
                        {isInProgress(item.status) && !item.volunteer && (
                          <Tooltip>
                            <button
                              className={`hover:text-success ${
                                volunteerFilter === 'with'
                                  ? 'opacity-50 cursor-not-allowed'
                                  : ''
                              }`}
                              onClick={() =>
                                volunteerFilter !== 'with' &&
                                handleAddVolunteer(item)
                              }
                              disabled={volunteerFilter === 'with'}
                            >
                              <svg
                                className="fill-current"
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9 0C4.02944 0 0 4.02944 0 9C0 13.9706 4.02944 18 9 18C13.9706 18 18 13.9706 18 9C18 4.02944 13.9706 0 9 0ZM13.5 9.75H9.75V13.5H8.25V9.75H4.5V8.25H8.25V4.5H9.75V8.25H13.5V9.75Z"
                                  fill=""
                                />
                              </svg>
                            </button>
                          </Tooltip>
                        )}
                        {viewMode === 'requests' &&
                          item.status === 'Pending' && (
                            <Tooltip>
                              <button
                                className="hover:text-danger"
                                onClick={() => handleDeleteRequest(item)}
                              >
                                <svg
                                  className="fill-current"
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M13.7535 2.47502H11.5879V1.9969C11.5879 1.15315 10.9129 0.478149 10.0691 0.478149H7.90352C7.05977 0.478149 6.38477 1.15315 6.38477 1.9969V2.47502H4.21914C3.40352 2.47502 2.72852 3.15002 2.72852 3.96565V4.8094C2.72852 5.42815 3.09414 5.9344 3.62852 6.1594L4.07852 15.4688C4.13477 16.6219 5.09102 17.5219 6.24414 17.5219H11.7004C12.8535 17.5219 13.8098 16.6219 13.866 15.4688L14.3441 6.13127C14.8785 5.90627 15.2441 5.3719 15.2441 4.78127V3.93752C15.2441 3.15002 14.5691 2.47502 13.7535 2.47502ZM7.67852 1.9969C7.67852 1.85627 7.79102 1.74377 7.93164 1.74377H10.0973C10.2379 1.74377 10.3504 1.85627 10.3504 1.9969V2.47502H7.70664V1.9969H7.67852ZM4.02227 3.96565C4.02227 3.85315 4.10664 3.74065 4.24727 3.74065H13.7535C13.866 3.74065 13.9785 3.82502 13.9785 3.96565V4.8094C13.9785 4.9219 13.8941 5.0344 13.7535 5.0344H4.24727C4.13477 5.0344 4.02227 4.95002 4.02227 4.8094V3.96565Z"
                                    fill=""
                                  />
                                </svg>
                              </button>
                            </Tooltip>
                          )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-gray-500">
              Showing {(page - 1) * itemsPerPage + 1} to{' '}
              {Math.min(page * itemsPerPage, transactions.length)} of{' '}
              {transactions.length} entries
            </div>
            <div className="flex space-x-2">
              <button
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="rounded-lg border px-4 py-2 disabled:opacity-50"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* Transaction Details Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col z-[99999]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Chi tiết đóng góp</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="grid gap-6">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Thông tin cơ bản
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Trạng thái:</div>
                      <div className="col-span-3">
                        <span
                          className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${getStatusColor(
                            selectedTransaction.status,
                          )}`}
                        >
                          {translateStatus(selectedTransaction.status)}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Ngày tạo:</div>
                      <div className="col-span-3">
                        {formatDate(selectedTransaction.createdAt)}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Thời gian hẹn:</div>
                      <div className="col-span-3">
                        {formatDate(selectedTransaction.appointmentDate)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Requester Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Thông tin người yêu cầu
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Tên:</div>
                      <div className="col-span-3">
                        {selectedTransaction.requester.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Thông tin sản phẩm
                  </h3>
                  {selectedTransaction.charitarianItem ? (
                    <div className="grid gap-4">
                      <img
                        src={selectedTransaction.charitarianItem.itemImages[0]}
                        alt={selectedTransaction.charitarianItem.itemName}
                        className="w-[50px]"
                      />
                      <div className="grid grid-cols-4 items-center gap-4">
                        <div className="font-medium">Tên sản phẩm:</div>
                        <div className="col-span-3">
                          {selectedTransaction.charitarianItem.itemName}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">Chưa có sản phẩm</div>
                  )}
                </div>

                {/* Charitarian Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Thông tin người tặng
                  </h3>
                  {selectedTransaction.charitarian ? (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <div className="font-medium">Tên:</div>
                        <div className="col-span-3">
                          {selectedTransaction.charitarian.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500">Chưa có người tặng</div>
                  )}
                </div>

                {/* Volunteer Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Thông tin tình nguyện viên
                  </h3>
                  {selectedTransaction.volunteer ? (
                    <div className="grid gap-4">
                      <div className="grid grid-cols-4 items-center gap-4">
                        <div className="font-medium">Tên:</div>
                        <div className="col-span-3">
                          {selectedTransaction.volunteer.name}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      {selectedTransaction.status === 'In_Progress' ? (
                        <div className="text-gray-500">
                          Chưa có tình nguyện viên
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <div className="font-medium">Tên:</div>
                            <div className="col-span-3">volunteer1</div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p>Bạn có chắc chắn muốn xóa đóng góp này?</p>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Volunteer Assignment Modal */}
      <Dialog open={showVolunteerModal} onOpenChange={setShowVolunteerModal}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Phân công tình nguyện viên</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            {isLoadingVolunteer ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : !Array.isArray(volunteers) || volunteers.length === 0 ? (
              <p className="text-center text-gray-500">
                Không tìm thấy tình nguyện viên phù hợp
              </p>
            ) : (
              <select
                className="w-full rounded-lg border border-stroke bg-white px-4 py-2 dark:border-strokedark dark:bg-boxdark"
                value={selectedVolunteer}
                onChange={(e) => setSelectedVolunteer(e.target.value)}
              >
                <option value="">Chọn tình nguyện viên</option>
                {volunteers.map((volunteer) => (
                  <option key={volunteer.userId} value={volunteer.userId}>
                    {volunteer.fullName ||
                      volunteer.username ||
                      'Unnamed Volunteer'}
                  </option>
                ))}
              </select>
            )}
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowVolunteerModal(false)}
            >
              Hủy
            </Button>
            <Button
              variant="default"
              onClick={handleVolunteerAssignment}
              disabled={!selectedVolunteer || isLoadingVolunteer}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Request Confirmation Dialog */}
      <Dialog
        open={showDeleteRequestConfirm}
        onOpenChange={setShowDeleteRequestConfirm}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Xác nhận hủy yêu cầu</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p>Bạn có chắc chắn muốn hủy yêu cầu này?</p>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowDeleteRequestConfirm(false)}
            >
              Không
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Có
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Thông báo</DialogTitle>
          </DialogHeader>
          <div className="px-6 py-4">
            <p className="text-danger">{errorMessage}</p>
          </div>
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="default" onClick={() => setShowErrorDialog(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionTable;
