
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  BookCopy, 
  Search, 
  QrCode, 
  BarChart3 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MOCK_BOOKS, MOCK_BORROW_RECORDS, MOCK_USERS } from '@/mock/data';

const Index = () => {
  const { user } = useAuth();
  
  const isLibrarian = user?.role === 'librarian';

  // Calculate simple statistics
  const totalBooks = MOCK_BOOKS.reduce((sum, book) => sum + book.quantity, 0);
  const availableBooks = MOCK_BOOKS.reduce((sum, book) => sum + book.availableQuantity, 0);
  const totalBorrowedBooks = totalBooks - availableBooks;
  const totalStudents = MOCK_USERS.filter(u => u.role === 'student').length;
  const totalActiveStudents = MOCK_USERS.filter(u => u.role === 'student' && !u.isBlocked).length;
  
  const studentBorrowedBooks = MOCK_BORROW_RECORDS.filter(
    record => record.userId === user?.id && record.status === 'borrowed'
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center text-center space-y-4 pb-6 border-b">
        <BookOpen size={48} className="text-library-primary" />
        <h1 className="text-3xl font-bold">Thư viện THPT Thanh Xuân</h1>
        <p className="text-gray-500 max-w-lg">
          Hệ thống quản lý thư viện giúp việc mượn trả sách trở nên dễ dàng và hiệu quả thông qua QR code.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Tổng số sách</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBooks}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sách đang được mượn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBorrowedBooks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Độc giả</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Độc giả đang hoạt động</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActiveStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4">Thao tác nhanh</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLibrarian ? (
            <>
              <Link to="/borrow">
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                  <QrCode size={24} className="text-library-primary" />
                  <span>Mượn/Trả sách</span>
                </Button>
              </Link>
              
              <Link to="/books">
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                  <BookCopy size={24} className="text-library-primary" />
                  <span>Quản lý sách</span>
                </Button>
              </Link>
              
              <Link to="/users">
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                  <Users size={24} className="text-library-primary" />
                  <span>QL Tài khoản</span>
                </Button>
              </Link>
              
              <Link to="/reports">
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                  <BarChart3 size={24} className="text-library-primary" />
                  <span>Báo cáo</span>
                </Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/search">
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                  <Search size={24} className="text-library-primary" />
                  <span>Tra cứu sách</span>
                </Button>
              </Link>
              
              <Link to="/account">
                <Button variant="outline" className="w-full h-24 flex flex-col items-center justify-center space-y-2">
                  <BookOpen size={24} className="text-library-primary" />
                  <span>Sách đang mượn</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity or Borrowed Books */}
      {!isLibrarian && studentBorrowedBooks.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">Sách đang mượn</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentBorrowedBooks.map(record => {
              const book = MOCK_BOOKS.find(b => b.id === record.bookId);
              if (!book) return null;
              
              const dueDate = new Date(record.dueDate);
              const today = new Date();
              const daysLeft = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card key={record.id}>
                  <CardHeader className="pb-2">
                    <CardTitle>{book.title}</CardTitle>
                    <CardDescription>{book.author}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <span className="font-semibold">Ngày mượn:</span>{" "}
                      {new Date(record.borrowDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm">
                      <span className="font-semibold">Hạn trả:</span>{" "}
                      {new Date(record.dueDate).toLocaleDateString('vi-VN')}
                      {daysLeft > 0 ? (
                        <span className="text-green-500 ml-2">({daysLeft} ngày còn lại)</span>
                      ) : (
                        <span className="text-red-500 ml-2">(Quá hạn {Math.abs(daysLeft)} ngày)</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
