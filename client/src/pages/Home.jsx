import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="text-center">
      <div className="hero-section bg-gradient-to-r from-blue-500 to-purple-600 text-white p-16 rounded-lg mb-8">
        <h1 className="text-5xl font-bold mb-4">Welcome to PustakDhaan</h1>
        <p className="text-xl mb-8">
          Empowering communities through book donations - Help spread literacy to government schools
        </p>
        <div className="space-x-4">
          <Link 
            to="/donation-drives" 
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 inline-block"
          >
            View Donation Drives
          </Link>
          <Link 
            to="/donate-books" 
            className="bg-yellow-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-600 inline-block"
          >
            Donate Books
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-xl font-semibold mb-2">Donate Books</h3>
          <p className="text-gray-600">
            Donate your non-academic books to help government schools build their libraries and spread literacy.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="text-4xl mb-4">🏫</div>
          <h3 className="text-xl font-semibold mb-2">Support Schools</h3>
          <p className="text-gray-600">
            Your donated books are allocated to government schools, helping students access quality reading materials.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold mb-2">Earn Badges</h3>
          <p className="text-gray-600">
            Earn Bronze (10 books), Silver (50 books), or Gold (100 books) badges based on your contributions.
          </p>
        </div>
      </div>

      <div className="mt-12 bg-gray-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-6">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2">Choose a Drive</h3>
            <p className="text-sm text-gray-600">Select an active donation drive in your gated community</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">2</span>
            </div>
            <h3 className="font-semibold mb-2">Fill the Form</h3>
            <p className="text-sm text-gray-600">Specify the number of books by age category and donation date</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">3</span>
            </div>
            <h3 className="font-semibold mb-2">Drop Books</h3>
            <p className="text-sm text-gray-600">Drop your books at the specified location between 9 AM - 7 PM</p>
          </div>
          
          <div className="text-center">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-blue-600">4</span>
            </div>
            <h3 className="font-semibold mb-2">Impact Schools</h3>
            <p className="text-sm text-gray-600">Books are allocated to government schools to help students learn</p>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-blue-50 p-8 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">Book Categories</h2>
        <p className="text-gray-600 mb-6">We accept non-academic books in the following age categories:</p>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg text-center">
            <h3 className="font-semibold text-lg">Age 2-4</h3>
            <p className="text-sm text-gray-600">Picture books, simple stories</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <h3 className="font-semibold text-lg">Age 4-6</h3>
            <p className="text-sm text-gray-600">Early readers, illustrated books</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <h3 className="font-semibold text-lg">Age 6-8</h3>
            <p className="text-sm text-gray-600">Chapter books, adventure stories</p>
          </div>
          <div className="bg-white p-4 rounded-lg text-center">
            <h3 className="font-semibold text-lg">Age 8-10</h3>
            <p className="text-sm text-gray-600">Novels, educational fiction</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
