
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BookOpen, QrCode, Search, Check, AlertTriangle } from 'lucide-react';
import QRScanner from '@/components/QRScanner';
import { MOCK_USERS, MOCK_BOOKS, MOCK_BORROW_RECORDS } from '@/mock/data';
import { User, Book, BorrowRecord } from '@/types';

enum BorrowReturnMode {
  IDLE,
  SCANNING,
  BOOK_INPUT,
  CONFIRM
}

const BorrowReturn = () => {
  const { user: librarian } = useAuth();
  const [mode, setMode] = useState<BorrowReturnMode>(BorrowReturnMode.IDLE);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserBlocked, setIsUserBlocked] = useState(false);
  const [isReturn, setIsReturn] = useState(false);
  const [bookISBN, setBookISBN] = useState('');
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [userBorrowRecords, setUserBorrowRecords] = useState<BorrowRecord[]>([]);

  const handleScanQR = (data: string) => {
    if (!data.startsWith('STUDENT:')) {
      toast.error('Mã QR không hợp lệ');
      return;
    }

    const userId = data.split(':')[1];
    const foundUser = MOCK_USERS.find(u => u.id === userId);
    
    if (!foundUser) {
      toast.error('Không tìm thấy tài khoản người dùng');
      return;
    }

    if (foundUser.role !== 'student') {
      toast.error('Tài khoản không phải là độc giả');
      return;
    }

    setCurrentUser(foundUser);
    setIsUserBlocked(!!foundUser.isBlocked);
    
    // Find user's borrow records
    const records = MOCK_BORROW_RECORDS.filter(record => 
      record.userId === foundUser.id && 
      record.status === 'borrowed'
    );
    setUserBorrowRecords(records);

    // If user has borrow records, default to return mode
    setIsReturn(records.length > 0);

    if (foundUser.isBlocked) {
      toast.error('Tài khoản bị khóa do quá hạn trả sách');
    } else {
      toast.success('Quét mã QR thành công');
      setMode(BorrowReturnMode.BOOK_INPUT);
    }
  };

  const searchBook = () => {
    if (!bookISBN) {
      setErrorMessage('Vui lòng nhập mã ISBN của sách');
      return;
    }

    const foundBook = MOCK_BOOKS.find(book => book.isbn === bookISBN);
    
    if (!foundBook) {
      setErrorMessage('Không tìm thấy sách với mã ISBN này');
      setCurrentBook(null);
      return;
    }

    setCurrentBook(foundBook);
    setErrorMessage('');

    // Check if book is already borrowed by this user
    if (isReturn) {
      const isBorrowedByUser = userBorrowRecords.some(
        record => {
          const book = MOCK_BOOKS.find(b => b.id === record.bookId);
          return book?.isbn === bookISBN;
        }
      );
      
      if (!isBorrowedByUser) {
        setErrorMessage('Độc giả không mượn sách này');
        return;
      }
    } else {
      // Check if book is available for borrowing
      if (foundBook.availableQuantity <= 0) {
        setErrorMessage('Sách này hiện không có sẵn để mượn');
        return;
      }
    }

    // Move to confirm step
    setMode(BorrowReturnMode.CONFIRM);
  };

  const handleConfirmAction = () => {
    if (!currentUser || !currentBook) return;

    if (isReturn) {
      // Process return
      toast.success(`${currentUser.fullName} đã trả sách "${currentBook.title}" thành công`);
    } else {
      // Process borrow
      toast.success(`${currentUser.fullName} đã mượn sách "${currentBook.title}" thành công`);
    }

    // Reset state
    resetState();
  };

  const resetState = () => {
    setMode(BorrowReturnMode.IDLE);
    setCurrentUser(null);
    setIsUserBlocked(false);
    setIsReturn(false);
    setBookISBN('');
    setCurrentBook(null);
    setErrorMessage('');
    setUserBorrowRecords([]);
  };

  if (!librarian || librarian.role !== 'librarian') {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Quyền truy cập bị từ chối</h2>
            <p className="text-gray-500 mb-4">
              Chức năng này chỉ dành cho thủ thư
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mượn/Trả sách</h1>
        <p className="text-gray-500">Quét mã QR của độc giả để bắt đầu quá trình mượn hoặc trả sách</p>
      </div>

      {mode === BorrowReturnMode.IDLE && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button 
                onClick={() => setMode(BorrowReturnMode.SCANNING)} 
                className="bg-library-primary"
              >
                <QrCode size={18} className="mr-2" />
                Quét mã QR
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {mode === BorrowReturnMode.BOOK_INPUT && currentUser && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h3 className="font-medium">Độc giả: {currentUser.fullName}</h3>
                <p className="text-sm text-gray-500">ID: {currentUser.id}</p>
              </div>
              <div>
                <div className={`px-2 py-1 text-xs rounded-full ${isUserBlocked 
                  ? "bg-red-100 text-red-800" 
                  : "bg-green-100 text-green-800"}`}
                >
                  {isUserBlocked ? "Tài khoản bị khóa" : "Tài khoản hoạt động"}
                </div>
              </div>
            </div>

            {!isUserBlocked && (
              <>
                <div className="flex space-x-2">
                  <Button 
                    variant={!isReturn ? "default" : "outline"} 
                    onClick={() => setIsReturn(false)}
                    className={!isReturn ? "bg-library-primary" : ""}
                  >
                    Mượn sách
                  </Button>
                  <Button 
                    variant={isReturn ? "default" : "outline"} 
                    onClick={() => setIsReturn(true)}
                    className={isReturn ? "bg-library-primary" : ""}
                  >
                    Trả sách
                  </Button>
                </div>

                {isReturn && userBorrowRecords.length > 0 && (
                  <div className="border rounded-md p-3">
                    <h4 className="font-medium mb-2">Sách đang mượn:</h4>
                    <ul className="space-y-2">
                      {userBorrowRecords.map(record => {
                        const book = MOCK_BOOKS.find(b => b.id === record.bookId);
                        return (
                          <li key={record.id} className="text-sm flex justify-between">
                            <span>{book?.title} ({book?.isbn})</span>
                            <span className="text-gray-500">
                              Hạn trả: {new Date(record.dueDate).toLocaleDateString('vi-VN')}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="isbn">Mã ISBN</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="isbn"
                      placeholder="Nhập mã ISBN của sách"
                      value={bookISBN}
                      onChange={(e) => setBookISBN(e.target.value)}
                    />
                    <Button onClick={searchBook}>
                      <Search size={18} className="mr-2" />
                      Tìm
                    </Button>
                  </div>
                  {errorMessage && (
                    <p className="text-sm text-red-500">{errorMessage}</p>
                  )}
                </div>
              </>
            )}

            {isUserBlocked && (
              <div className="bg-yellow-50 p-4 rounded-md">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <div>
                    <h3 className="font-medium text-yellow-800">Tài khoản bị khóa</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tài khoản đã bị khóa do {currentUser.blockReason || "quá hạn trả sách"}. 
                      Cần mở khóa tài khoản trước khi thực hiện mượn/trả sách.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3" 
                      onClick={resetState}
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {mode === BorrowReturnMode.CONFIRM && currentBook && (
        <Card className="mb-6">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-28 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                {currentBook.coverImage ? (
                  <img 
                    src={currentBook.coverImage} 
                    alt={currentBook.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen size={24} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium">{currentBook.title}</h3>
                <p className="text-sm text-gray-500">
                  Tác giả: {currentBook.author}
                </p>
                <p className="text-sm text-gray-500">
                  ISBN: {currentBook.isbn}
                </p>
                {!isReturn && (
                  <p className="text-sm text-gray-500">
                    Còn lại: {currentBook.availableQuantity}/{currentBook.quantity}
                  </p>
                )}
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="font-medium text-blue-800">Xác nhận</h4>
              <p className="text-sm text-blue-700">
                {isReturn 
                  ? `${currentUser?.fullName} sẽ trả sách "${currentBook.title}".`
                  : `${currentUser?.fullName} sẽ mượn sách "${currentBook.title}".`
                }
              </p>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={resetState}
              >
                Hủy
              </Button>
              <Button 
                className="flex-1 bg-library-primary"
                onClick={handleConfirmAction}
              >
                <Check size={18} className="mr-2" />
                {isReturn ? 'Xác nhận trả sách' : 'Xác nhận mượn sách'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={mode === BorrowReturnMode.SCANNING} onOpenChange={(open) => {
        if (!open) setMode(BorrowReturnMode.IDLE);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quét mã QR</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <QRScanner 
              onScan={handleScanQR} 
              onClose={() => setMode(BorrowReturnMode.IDLE)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowReturn;
