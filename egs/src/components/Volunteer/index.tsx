import { useEffect, useState } from 'react';
import { Volunteer } from '@/types/types';
import { Tooltip } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { fetchVolunteers } from '@/services/VolunteerService';
import axiosInstance from '@/api/axiosInstance';
import { formatAvailableTimeWithoutPattern } from '@/utils/format-date';
import { set } from 'date-fns';
import WeekDisplay from '../DateByWeek/DateByWeek';

const VolunteerTable = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [flag, setFlag] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  // Initialize volunteers as empty array to prevent undefined errors
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [dateNow, setDateNow] = useState<Date | null>(null);
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      setLoading(true);
      // Add better error handling - check if data exists before setting state
      const res = await fetchVolunteers();
        setVolunteers(res || []);
    } catch (err) {
      setError('Failed to load volunteers');
      console.error(err);
      // Ensure volunteers is set to empty array on error
      setVolunteers([]);
    } finally {
      setLoading(false);
    }
  };

  function parseVNDateTime(dateTimeStr: string) {
    // Tách phần thời gian và ngày tháng
    const [time, date] = dateTimeStr.split(" ");
    const [hours, minutes, seconds] = time.split(":").map(Number);
    const [day, month, year] = date.split("/").map(Number);

    // Tạo đối tượng Date ở UTC
    const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));

    // Chuyển về giờ Việt Nam (GMT+7)
    return new Date(utcDate.getTime() + 7 * 60 * 60 * 1000);
}

useEffect(() => {
  const fetchDateNow = async () => {
    try {
      const response = await axiosInstance.get("time/now");
      const date = parseVNDateTime(response.data.data);
      setDateNow(date);
    } catch (error) {
      console.error("Lỗi khi lấy thời gian từ API:", error);
    }
  };

  fetchDateNow();
}, []);

  useEffect(() => {
    setFile(null);
    fetchData();
  }, [flag]);

  const handleViewVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowModal(true);
  };

  const handleFileChange = (event: any) => {
    setMessage("");
    setError("");
    setFile(event.target.files[0]);
  };

  const handleAddVolunteerByExcel = async () => {
    if (!file) {
      setMessage("Vui lòng chọn một file Excel trước khi tải lên.");
      return;
    }
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const response = await axiosInstance.post("user/volunteer/import", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      if (response.data.isSuccess) {
        setFlag(!flag);
        alert("Tải lên thành công!");
        setLoading(false);
      }
      setMessage("Tải lên thành công!");
    } catch (error) {
      alert("Tải lên thất bại.");
      setMessage("Tải lên thất bại. Vui lòng thử lại.");
      setLoading(false);
    }
  };

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

  // Safely access the volunteers array with a null check
  const paginatedVolunteers = volunteers?.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  ) || [];

  // Safely calculate totalPages with a null check
  const totalPages = Math.ceil((volunteers?.length || 0) / itemsPerPage);

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className='flex justify-between items-center'>
        <h2 className="text-2xl font-semibold text-black dark:text-white mb-4">
          Thêm mới danh sách tình nguyện viên
        </h2>
        { dateNow && (
          <WeekDisplay date={dateNow} />
        )}
      </div>
      <div className="mb-4 flex justify-between items-center">
        <div className="flex flex-col items-start gap-4">
          <div>
            <input type="file" accept=".xlsx, .xls, .xlsm" onChange={handleFileChange} />
            <button
              onClick={handleAddVolunteerByExcel}
              className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
            >
              Thêm
            </button>
          </div>
          {message && !file  && <p className='text-red-500'>{message}</p>}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchData}
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
          >
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-danger bg-opacity-10 p-4 text-danger">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : !volunteers || volunteers.length === 0 ? (
        <div className="flex justify-center py-8 text-gray-500">
          No volunteer found
        </div>
      ) : (
        <>
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto">
              <thead>
                <tr className="bg-gray-2 text-left dark:bg-meta-4">
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Họ và tên
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Tài khoản
                  </th>
                  <th className="min-w-[150px] py-4 px-4 font-medium text-black dark:text-white">
                    Email
                  </th>
                  <th className="min-w-[120px] py-4 px-4 font-medium text-black dark:text-white">
                    Thời gian rãnh trong tuần
                  </th>
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedVolunteers.map((item, key) => (
                  <tr key={key}>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {item.fullname}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {item.username}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {item.email}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <p className="text-black dark:text-white">
                        {item.altAvailableTime ? formatAvailableTimeWithoutPattern(item.altAvailableTime) : formatAvailableTimeWithoutPattern(item.availableTime)}
                      </p>
                    </td>
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <Tooltip>
                          <button
                            className="hover:text-primary"
                            onClick={() => handleViewVolunteer(item)}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <div className="text-gray-500">
              Showing {volunteers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} to{' '}
              {Math.min(page * itemsPerPage, volunteers.length)} of{' '}
              {volunteers.length} entries
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

      {/* Volunteer Details Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col z-[99999]">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle>Chi tiết tình nguyện viên</DialogTitle>
          </DialogHeader>

          {selectedVolunteer && (
            <div className="flex-1 overflow-y-auto px-6">
              <div className="grid gap-6">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">
                    Thông tin cơ bản
                  </h3>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">ID:</div>
                      <div className="col-span-3">
                        {selectedVolunteer.userId}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Họ và tên:</div>
                      <div className="col-span-3">
                        {selectedVolunteer.fullname}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Tài khoản:</div>
                      <div className="col-span-3">
                        {selectedVolunteer.username}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Email:</div>
                      <div className="col-span-3">
                        {selectedVolunteer.email}
                      </div>
                    </div>
                      <div className="grid grid-cols-4 items-center gap-4">
                        <div className="font-medium">Thời gian rảnh hiển thị:</div>
                        <div className="col-span-3">
                          {selectedVolunteer.altAvailableTime ? formatAvailableTimeWithoutPattern(selectedVolunteer.altAvailableTime) : formatAvailableTimeWithoutPattern(selectedVolunteer.availableTime) || 'N/A'}
                        </div>
                      </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <div className="font-medium">Thời gian đăng ký ban đầu:</div>
                      <div className="col-span-3">
                        {formatAvailableTimeWithoutPattern(selectedVolunteer.availableTime) || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VolunteerTable;