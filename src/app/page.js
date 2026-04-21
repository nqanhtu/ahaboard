import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getBoardData, getUsers, getBoards } from "@/actions/kanban"
import KanbanBoard from "@/components/KanbanBoard"
import BoardSelector from "@/components/BoardSelector"
import { handleSignOut } from "@/actions/auth"

export const metadata = {
  title: 'Aha Kanban',
}

export default async function Home({ searchParams }) {
  const session = await auth()
  const params = await searchParams
  
  if (!session) {
    redirect('/login')
  }

  const boardId = params?.boardId
  const board = await getBoardData(boardId)
  const boards = await getBoards()
  const users = await getUsers()

  if (!board && boards.length === 0) {
    return (
      <div style={{ padding: '20px', color: 'white' }}>
        Không tìm thấy bảng công việc. Vui lòng chạy script khởi tạo.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Navbar wrapper */}
      <div className="h-[72px] flex items-center px-8 text-gray-800 bg-white/70 backdrop-blur-md border-b border-green-900/5 shadow-sm z-10">
        <div className="flex items-center gap-3 font-bold text-lg text-green-800">
          <svg width="28" height="28" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="10" fill="#22c55e"/>
            <rect x="6" y="7" width="5" height="18" rx="1.5" fill="white" opacity="0.95"/>
            <rect x="13.5" y="7" width="5" height="12" rx="1.5" fill="white" opacity="0.95"/>
            <rect x="21" y="7" width="5" height="15" rx="1.5" fill="white" opacity="0.95"/>
          </svg>
          Aha Kanban
        </div>
        
        {boards.length > 0 && (
          <div className="ml-8">
            <BoardSelector boards={boards} activeBoardId={board?.id} />
          </div>
        )}

        <div className="flex items-center gap-6 ml-auto">
          <div className="text-[15px] font-semibold text-gray-600">
            Xin chào, <span className="text-gray-900">{session.user.name || session.user.username}</span>
          </div>
          <form action={handleSignOut}>
            <button type="submit" className="bg-white hover:bg-gray-50 text-gray-700 px-5 py-2 rounded-full text-sm font-bold shadow-sm border border-gray-200 transition-all hover:shadow-md hover:border-gray-300 active:scale-95">
              Đăng xuất
            </button>
          </form>
        </div>
      </div>

      {board && <div className="flex-1 overflow-hidden"><KanbanBoard key={board.id} initialBoard={board} users={users} /></div>}
    </div>
  )
}
