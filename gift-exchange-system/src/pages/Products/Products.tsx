import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Eye,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Package2,
  Tag,
  MapPin,
  FileText,
  Flag,
  RotateCw,
  Image,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import axiosInstance from '@/api/axiosInstance';
import { Product, TimeRange } from '@/types/types';
import { formatDate } from '@/utils/format-date';
import { TransactionDetailsDialog } from '@/components/Transaction/TransactionDetail';
import { ReportDialog } from '@/components/Report/ReportModal';
import RejectDialog from '@/components/Reject/RejectModal';

const ProductDashboard: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(8);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] =
    useState<string>('');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [productToReject, setProductToReject] = useState<Product | null>(null);

  const [timeRange, setTimeRange] = useState('all');

  // Hàm lọc sản phẩm theo khoảng thời gian
  const filterByTimeRange = (products: Product[]): Product[] => {
    const now = new Date();

    return products.filter((product) => {
      const createdAt = new Date(product.createdAt);

      switch (timeRange) {
        case 'last24hours':
          return now.getTime() - createdAt.getTime() <= 24 * 60 * 60 * 1000;
        case 'last7days':
          return now.getTime() - createdAt.getTime() <= 7 * 24 * 60 * 60 * 1000;
        case 'last30days':
          return (
            now.getTime() - createdAt.getTime() <= 30 * 24 * 60 * 60 * 1000
          );
        default:
          return true; // Tất cả thời gian
      }
    });
  };

  // Sử dụng hàm lọc trong việc hiển thị sản phẩm
  const filteredProducts = filterByTimeRange(products)
    .filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.name.includes(searchTerm),
    )
    .filter((product) =>
      filterStatus === 'all' ? true : product.status === filterStatus,
    );

  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * productsPerPage,
    currentPage * productsPerPage,
  );

  const sortOrder = [
    'Pending',
    'Approved',
    'In_Transaction',
    'Exchanged',
    'Rejected',
    'Out_of_date',
  ];

  const handleReload = async () => {
    setIsLoading(true);
    try {
      await fetchProducts();
      toast.success('Products reloaded successfully');
    } catch (error) {
      toast.error('Failed to reload products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('items/admin/view-all');
      if (response.data.isSuccess) {
        const sortedProducts = response.data.data.sort(
          (a: Product, b: Product) => {
            const statusA = a.status;
            const statusB = b.status;
            const statusComparison =
              sortOrder.indexOf(statusA) - sortOrder.indexOf(statusB);

            if (statusComparison !== 0) {
              return statusComparison;
            }

            // If statuses are the same, sort by createdAt
            const createdAtComparison =
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            if (createdAtComparison !== 0) {
              return createdAtComparison;
            }

            // If createdAt dates are the same, sort by expiresAt
            return (
              new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
            );
          },
        );
        setProducts(sortedProducts);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleApprove = async (product: Product) => {
    try {
      const response = await axiosInstance.post(`items/approve/${product.id}`);
      if (response.data.isSuccess) {
        await fetchProducts();
        toast.success('Product approved successfully');
        await axiosInstance.post(
          `notification/send?userId=${product.owner_id}`,
          {
            type: 'success',
            message: 'Sản phẩm của bạn đã được duyệt.',
            title: 'Thông báo',
            entity: 'Item',
            entityId: product.id,
          },
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to approve product');
    }
  };

  const handleReject = async (rejectMessage: string) => {
    if (!productToReject) return;

    try {
      const response = await axiosInstance.post(
        `items/reject/${productToReject.id}`,
        {
          reject_message: rejectMessage,
        },
      );

      if (response.data.isSuccess) {
        await fetchProducts();
        toast.success('Product rejected successfully');
        await axiosInstance.post(
          `notification/send?userId=${productToReject.owner_id}`,
          {
            type: 'error',
            message: 'Sản phẩm của bạn đã bị từ chối',
            title: 'Thông báo',
            entity: 'Item',
            entityId: productToReject.id,
          },
        );
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Failed to reject product');
      console.log(error);
    }
  };

  const statusCounts = products.reduce(
    (acc, product) => {
      const status = product.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as { [key: string]: number },
  );

  const formatAvailableTime = (timeString: string) => {
    if (!timeString) return 'Không xác định';
    return formatTimeRangeDisplay(timeString);
  };

  const parseTimeRange = (
    timeString: string,
  ): {
    type: string;
    timeRanges: TimeRange[];
  } => {
    if (!timeString) return { type: '', timeRanges: [] };

    const [type, ...rest] = timeString.split(' ');

    // Xử lý customPerDay với format mới
    if (type === 'customPerDay') {
      const ranges = rest
        .join(' ')
        .split('|')
        .map((segment) => {
          const [timeRange, day] = segment.trim().split(' ');
          const [start, end] = timeRange.split('_');
          const [startHour, startMinute] = start.split(':').map(Number);
          const [endHour, endMinute] = end.split(':').map(Number);

          return {
            day: day,
            startHour,
            startMinute,
            endHour,
            endMinute,
          };
        });

      return { type, timeRanges: ranges };
    } else {
      const [hours, days] = rest;
      const [start, end] = hours.split('_');
      const [startHour, startMinute] = start.split(':').map(Number);
      const [endHour, endMinute] = end.split(':').map(Number);

      const daysArray = days.split('_');
      const ranges = daysArray.map((day) => ({
        day,
        startHour,
        startMinute,
        endHour,
        endMinute,
      }));

      return { type, timeRanges: ranges };
    }

    return { type, timeRanges: [] };
  };

  const formatTimeRangeDisplay = (timeString: string): JSX.Element => {
    const { timeRanges } = parseTimeRange(timeString);

    const dayTranslations: Record<string, string> = {
      '2': 'Thứ Hai',
      '3': 'Thứ Ba',
      '4': 'Thứ Tư',
      '5': 'Thứ Năm',
      '6': 'Thứ Sáu',
      '7': 'Thứ Bảy',
      '8': 'Chủ Nhật',
      mon: 'Thứ Hai',
      tue: 'Thứ Ba',
      wed: 'Thứ Tư',
      thu: 'Thứ Năm',
      fri: 'Thứ Sáu',
      sat: 'Thứ Bảy',
      sun: 'Chủ Nhật',
    };

    // Group timeRanges by same time
    const groupedRanges = timeRanges.reduce(
      (acc, curr) => {
        const key = `${String(curr.startHour).padStart(2, '0')}:${String(
          curr.startMinute,
        ).padStart(2, '0')}-${String(curr.endHour).padStart(2, '0')}:${String(
          curr.endMinute,
        ).padStart(2, '0')}`;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(curr.day);
        return acc;
      },
      {} as Record<string, string[]>,
    );

    return (
      <div className="space-y-3">
        {Object.entries(groupedRanges).map(([timeRange, days], index) => (
          <div key={index} className="bg-orange-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-orange-100 text-orange-800">
                {timeRange}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {days.map((day, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-gray-700 border border-gray-200"
                >
                  {dayTranslations[day] || day}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stroke">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-black">
              Quản lí các sản phẩm
            </h2>

            <div className="flex items-center gap-3">
              <select
                className="px-3 py-2 text-sm border border-stroke rounded-sm focus:outline-none focus:border-primary"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="all">Tất cả thời gian</option>
                <option value="last24hours">24 giờ qua</option>
                <option value="last7days">7 ngày qua</option>
                <option value="last30days">30 ngày qua</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 w-48 text-sm border border-stroke rounded-sm focus:outline-none focus:border-primary"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  width="16"
                  height="16"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>

              <button
                onClick={handleReload}
                className={`p-2 rounded-sm border border-stroke text-gray-500 hover:bg-gray-50 transition-all ${
                  isLoading ? 'animate-spin' : ''
                }`}
                title="Reload products"
              >
                <RotateCw size={16} />
              </button>
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              { status: 'Pending', label: 'Đang chờ', color: 'yellow' },
              { status: 'Approved', label: 'Đã duyệt', color: 'green' },
              {
                status: 'In_Transaction',
                label: 'Đang trao đổi',
                color: 'blue',
              },
              { status: 'Exchanged', label: 'Đã trao đổi', color: 'purple' },
              { status: 'Out_of_date', label: 'Hết hạn', color: 'gray' },
              { status: 'Rejected', label: 'Đã từ chối', color: 'red' },
            ].map(({ status, label, color }) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filterStatus === status
                    ? `bg-${color}-500 text-white`
                    : `bg-${color}-50 text-${color}-700 hover:bg-${color}-100`
                }`}
              >
                {label}: {statusCounts[status] || 0}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="max-w-full overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="bg-gray-2 text-left">
                    <th className="py-4 px-4 font-medium text-black">
                      Sản phẩm
                    </th>
                    <th className="py-4 px-4 font-medium text-black">
                      Ngày tạo
                    </th>
                    <th className="py-4 px-4 font-medium text-black">
                      Trạng thái
                    </th>
                    <th className="py-4 px-4 font-medium text-black">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentProducts.map((product) => (
                    <tr key={product.id} className="border-b border-[#eee]">
                      <td className="py-5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-sm object-cover"
                          />
                          <div>
                            <h5 className="font-medium text-black">
                              {product.name}
                            </h5>
                            <p className="text-sm text-gray-500">
                              {product.category.name}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <p className="text-black">
                          {formatDate(product.createdAt)}
                        </p>
                      </td>
                      <td className="py-5 px-4">
                        <span
                          className={`inline-flex rounded-full bg-opacity-10 py-1 px-3 text-sm font-medium ${
                            product.status === 'Pending'
                              ? 'bg-warning text-warning'
                              : product.status === 'Approved'
                              ? 'bg-success text-success'
                              : product.status === 'In_Transaction'
                              ? 'bg-info text-info'
                              : product.status === 'Exchanged'
                              ? 'bg-purple-500 text-purple-500'
                              : product.status === 'Out_of_date'
                              ? 'bg-gray-500 text-gray-500'
                              : 'bg-danger text-danger'
                          }`}
                        >
                          {product.status === 'Pending'
                            ? 'Đang chờ duyệt'
                            : product.status === 'Approved'
                            ? 'Được duyệt'
                            : product.status === 'In_Transaction'
                            ? 'Đang trao đổi'
                            : product.status === 'Exchanged'
                            ? 'Đã trao đổi'
                            : product.status === 'Out_of_date'
                            ? 'Hết hạn'
                            : 'Đã từ chối'}
                        </span>
                      </td>
                      <td className="py-5 px-4">
                        <div className="flex items-center space-x-3.5">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setIsModalOpen(true);
                            }}
                            className="hover:text-primary"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          {product.status === 'Pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(product)}
                                className="hover:text-success"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setProductToReject(product);
                                  setIsRejectDialogOpen(true);
                                }}
                                className="hover:text-danger"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * productsPerPage + 1} to{' '}
              {Math.min(currentPage * productsPerPage, filteredProducts.length)}{' '}
              of {filteredProducts.length} results
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-stroke rounded-sm disabled:opacity-50"
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`px-3 py-1 rounded-sm ${
                    currentPage === index + 1
                      ? 'bg-primary text-white'
                      : 'border border-stroke'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-stroke rounded-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          {/* Enhanced Dialog */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto fixed top-[55%] left-[60%] translate-x-[-50%] translate-y-[-50%] bg-white rounded-lg">
              <DialogHeader className="space-y-1">
                <DialogTitle className="text-2xl font-bold text-gray-900">
                  Thông tin sản phẩm
                </DialogTitle>
                <p className="text-sm text-gray-500">
                  Xem thông tin chi tiết về sản phẩm này
                </p>
              </DialogHeader>

              {selectedProduct && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 pb-6">
                  {/* Image Section */}
                  <div className="space-y-4">
                    <div className="aspect-square overflow-hidden rounded-2xl border-2 border-gray-100">
                      <img
                        src={selectedProduct.images[0]}
                        alt={selectedProduct.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {selectedProduct.images.slice(1).map((image, index) => (
                        <div
                          key={index}
                          className="aspect-square overflow-hidden rounded-lg border border-gray-100"
                        >
                          <img
                            src={image}
                            alt={`${selectedProduct.name} ${index + 2}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Details Section */}
                  <div className="space-y-6">
                    {/* Header */}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">
                        Tên sản phẩm: {selectedProduct.name}
                      </h3>
                      <p className="mt-2 text-gray-600">
                        Mô tả: {selectedProduct.description}
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center gap-1
    ${
      selectedProduct.status === 'Pending'
        ? 'bg-yellow-100 text-yellow-700'
        : selectedProduct.status === 'Approved'
        ? 'bg-green-100 text-green-700'
        : selectedProduct.status === 'In_Transaction'
        ? 'bg-blue-100 text-blue-700'
        : selectedProduct.status === 'Exchanged'
        ? 'bg-purple-100 text-purple-700'
        : selectedProduct.status === 'Out_of_date'
        ? 'bg-gray-100 text-gray-700'
        : selectedProduct.status === 'Rejected'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-700'
    }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full
      ${
        selectedProduct.status === 'Pending'
          ? 'bg-yellow-500'
          : selectedProduct.status === 'Approved'
          ? 'bg-green-500'
          : selectedProduct.status === 'In_Transaction'
          ? 'bg-blue-500'
          : selectedProduct.status === 'Exchanged'
          ? 'bg-purple-500'
          : selectedProduct.status === 'Out_of_date'
          ? 'bg-gray-500'
          : selectedProduct.status === 'Rejected'
          ? 'bg-red-500'
          : 'bg-gray-500'
      }`}
                        />
                        {selectedProduct.status === 'Pending'
                          ? 'Đang chờ duyệt'
                          : selectedProduct.status === 'Approved'
                          ? 'Được duyệt'
                          : selectedProduct.status === 'In_Transaction'
                          ? 'Đang trao đổi'
                          : selectedProduct.status === 'Exchanged'
                          ? 'Đã trao đổi'
                          : selectedProduct.status === 'Out_of_date'
                          ? 'Hết hạn'
                          : selectedProduct.status === 'Rejected'
                          ? 'Đã từ chối'
                          : selectedProduct.status}
                      </span>
                    </div>

                    {/* Transaction Participants */}
                    <div className="space-y-4 mb-6">
                      {selectedProduct.charitarian && (
                        <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-4">
                          <img
                            src={selectedProduct.charitarian.image}
                            alt={selectedProduct.charitarian.name}
                            className="w-12 h-12 rounded-full border-2 border-blue-200"
                          />
                          <div>
                            <p className="text-sm text-blue-600 font-medium">
                              Người cho
                            </p>
                            <p className="font-semibold">
                              {selectedProduct.charitarian.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {selectedProduct.requester && (
                        <div className="p-4 bg-green-50 rounded-lg flex items-center gap-4">
                          <img
                            src={selectedProduct.requester.image}
                            alt={selectedProduct.requester.name}
                            className="w-12 h-12 rounded-full border-2 border-green-200"
                          />
                          <div>
                            <p className="text-sm text-green-600 font-medium">
                              Người nhận
                            </p>
                            <p className="font-semibold">
                              {selectedProduct.requester.name}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Reject Message */}
                    {selectedProduct.status === 'Rejected' &&
                      selectedProduct.rejectMessage && (
                        <div className="mt-4 bg-red-50 border border-red-100 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-red-800 mb-1">
                                Lý do từ chối:
                              </p>
                              <p className="text-sm text-red-700">
                                {selectedProduct.rejectMessage}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Checking Information */}
                    {selectedProduct.checking && (
                      <div className="space-y-4 mb-6">
                        <div className="font-medium text-gray-700">
                          Thông tin kiểm duyệt
                        </div>

                        {/* Bad Words Section */}
                        {selectedProduct.checking.badWordsInName.length > 0 ||
                        selectedProduct.checking.badWordsInDescription.length >
                          0 ? (
                          <div className="bg-red-50 rounded-lg p-4">
                            {selectedProduct.checking.badWordsInName.length >
                              0 && (
                              <div className="mb-2">
                                <span className="font-medium text-red-800">
                                  Từ ngữ không phù hợp trong tên sản phẩm:
                                </span>
                                <div className="mt-1 text-red-600">
                                  {selectedProduct.checking.badWordsInName.join(
                                    ', ',
                                  )}
                                </div>
                              </div>
                            )}

                            {selectedProduct.checking.badWordsInDescription
                              .length > 0 && (
                              <div>
                                <span className="font-medium text-red-800">
                                  Từ ngữ không phù hợp trong mô tả:
                                </span>
                                <div className="mt-1 text-red-600">
                                  {selectedProduct.checking.badWordsInDescription.join(
                                    ', ',
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-green-50 rounded-lg p-4">
                            <span className="font-medium text-green-800">
                              Không tìm thấy từ ngữ không phù hợp
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Image Tags */}
                    <div className="mt-6 space-y-4">
                      <div className="bg-gray-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2 mb-3">
                          <Image className="w-5 h-5 text-blue-500" />
                          <span className="text-sm font-semibold text-gray-700">
                            NHẬN DIỆN HÌNH ẢNH
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(
                            selectedProduct.checking.imageTags,
                          ).map(([imageKey, tags], idx) => (
                            <div
                              key={idx}
                              className="bg-white p-3 rounded-lg shadow-sm"
                            >
                              <p className="text-sm text-gray-600 mb-2">
                                Hình ảnh {idx + 1}:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {tags.map((tag, tagIdx) => (
                                  <div
                                    key={tagIdx}
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm
                                      ${
                                        tag.isMatchingCategory
                                          ? 'bg-green-50 hover:bg-green-100'
                                          : 'bg-red-50 hover:bg-red-100'
                                      } 
                                      transition-colors duration-200`}
                                  >
                                    <span
                                      className={
                                        tag.isMatchingCategory
                                          ? 'text-green-700'
                                          : 'text-red-700'
                                      }
                                    >
                                      {tag.tag.en}
                                    </span>
                                    <span
                                      className={`ml-1.5 text-xs ${
                                        tag.isMatchingCategory
                                          ? 'text-green-500'
                                          : 'text-red-500'
                                      }`}
                                    >
                                      {tag.confidence.toFixed(0)}%
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Tag className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-semibold text-gray-700">
                            DANH MỤC
                          </span>
                        </div>
                        <p className="mt-1 text-orange-600 font-medium">
                          {selectedProduct.category.parentName}
                        </p>
                        <p className="mt-1 text-orange-600 font-medium">
                          {selectedProduct.category.name}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Package2 className="w-5 h-5 text-orange-500" />
                          <span className="text-sm font-semibold text-gray-700">
                            TÌNH TRẠNG
                          </span>
                        </div>
                        <p className="mt-1 text-orange-600 font-medium">
                          {selectedProduct.condition === 'New'
                            ? 'Mới'
                            : selectedProduct.condition === 'Used'
                            ? 'Đã sử dụng'
                            : selectedProduct.condition}
                        </p>
                      </div>
                      <div
                        className={`bg-orange-50 p-4 rounded-xl ${
                          !selectedProduct.isGift ? 'col-span-1' : 'col-span-2'
                        }`}
                      >
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          THỜI GIAN
                        </p>
                        {formatAvailableTime(selectedProduct.availableTime)}
                      </div>

                      {selectedProduct.isGift === false && (
                        <div className="bg-orange-50 p-4 rounded-xl">
                          <p className="text-sm font-semibold text-gray-700">
                            DANH MỤC MUỐN ĐỔI
                          </p>
                          <p className="mt-1 text-orange-600 font-medium">
                            {selectedProduct.desiredCategory !== null
                              ? selectedProduct.desiredCategory?.name
                              : 'Không có danh mục muốn đổi'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Points & Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-orange-50 p-4 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700">
                          SỐ LƯỢNG
                        </p>
                        <p className="mt-1 text-3xl font-bold text-orange-500">
                          {selectedProduct.quantity}
                        </p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl">
                        <p className="text-sm font-semibold text-gray-700">
                          QUÀ TẶNG
                        </p>
                        <p className="mt-1 text-orange-600 font-medium">
                          {selectedProduct.isGift ? 'Có' : 'Không'}
                        </p>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="border-t border-gray-100 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-orange-500" />
                          <div>
                            <p className="text-xs text-gray-500">Tạo lúc</p>
                            <p className="text-sm font-medium">
                              {formatDate(selectedProduct.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedProduct.status !== 'Pending' && (
                            <>
                              <Calendar className="w-4 h-4 text-orange-500" />
                              <div>
                                <p className="text-xs text-gray-500">Hết hạn</p>
                                <p className="text-sm font-medium">
                                  {formatDate(selectedProduct.expiresAt)}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Add Address - New Section */}
                    <div className="bg-orange-50 p-4 rounded-xl col-span-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-orange-500" />
                        <span className="text-sm font-semibold text-gray-700">
                          ĐỊA CHỈ
                        </span>
                      </div>
                      <p className="mt-1 text-orange-600 font-medium">
                        {selectedProduct.address?.address || 'Không có địa chỉ'}
                      </p>
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center gap-3 bg-orange-50 p-4 rounded-xl">
                      <img
                        src={selectedProduct.profilePicture}
                        alt={selectedProduct.owner_Name}
                        className="w-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-sm text-gray-500">Chủ sở hữu</p>
                        <p className="font-medium text-gray-900">
                          {selectedProduct.owner_Name}
                        </p>
                      </div>
                    </div>

                    {/* Sticky Action Buttons */}
                    <div className="sticky bottom-0 bg-white pt-4 border-t">
                      {selectedProduct.status === 'Pending' ? (
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              handleApprove(selectedProduct);
                              setIsModalOpen(false);
                            }}
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg
            transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-5 h-5" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => {
                              setProductToReject(selectedProduct);
                              setIsRejectDialogOpen(true);
                              setIsModalOpen(false);
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg
            transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-5 h-5" />
                            Từ chối
                          </button>
                        </div>
                      ) : selectedProduct.status === 'Exchanged' ? (
                        <div className="flex gap-4">
                          <button
                            onClick={() => {
                              setSelectedTransactionId(
                                selectedProduct.transactionRequestIdOfItem ||
                                  '',
                              );
                              setIsTransactionModalOpen(true);
                            }}
                            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
            transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText className="w-5 h-5" />
                            Chi tiết giao dịch
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTransactionId(
                                selectedProduct.transactionRequestIdOfItem ||
                                  '',
                              );
                              setIsReportModalOpen(true);
                            }}
                            className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 
            transition-colors flex items-center justify-center gap-2"
                          >
                            <Flag className="w-5 h-5" />
                            Chi tiết báo cáo
                          </button>
                        </div>
                      ) : selectedProduct.status === 'Approved' ||
                        selectedProduct.status === 'In_Transaction' ? (
                        <div className="flex">
                          <button
                            onClick={() => {
                              setProductToReject(selectedProduct);
                              setIsRejectDialogOpen(true);
                              setIsModalOpen(false);
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg
                        transition-colors duration-200 flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-5 h-5" />
                            Từ chối
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <TransactionDetailsDialog
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        transactionId={selectedTransactionId}
      />

      <ReportDialog
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        transactionId={selectedTransactionId}
      />

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => {
          setIsRejectDialogOpen(false);
          setProductToReject(null);
        }}
        onConfirm={handleReject}
      />
    </>
  );
};

export default ProductDashboard;
