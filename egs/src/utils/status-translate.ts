// Update the STATUS_TRANSLATIONS object

const STATUS_TRANSLATIONS = {
  In_Progress: 'Đang thực hiện',
  Completed: 'Hoàn thành',
  Not_Completed: 'Chưa hoàn thành',
  Pending: 'Đang chờ',
  Approved: 'Đã duyệt',
  Canceled: 'Đã hủy',
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-success text-success'; // Green
    case 'Pending':
      return 'bg-primary text-primary'; // Blue
    case 'In_Progress':
      return 'bg-warning text-warning'; // Yellow/Orange
    case 'Not_Completed':
      return 'bg-meta-6 text-meta-6'; // Blue
    case 'Canceled':
      return 'bg-danger text-danger'; // Red
    case 'Approved':
      return 'bg-success text-success'; // Green
    default:
      return 'bg-gray-500 text-gray-500';
  }
};

export { STATUS_TRANSLATIONS, getStatusColor };
