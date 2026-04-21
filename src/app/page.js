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
    <div className="app-layout">
      {/* Navbar wrapper */}
      <div className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
          <svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="8" fill="#0f766e"/>
            <rect x="6" y="7" width="5" height="18" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="13.5" y="7" width="5" height="12" rx="1.5" fill="white" opacity="0.9"/>
            <rect x="21" y="7" width="5" height="15" rx="1.5" fill="white" opacity="0.9"/>
          </svg>
          Aha Kanban
        </div>
        
        {boards.length > 0 && (
          <div style={{ marginLeft: '24px' }}>
            <BoardSelector boards={boards} activeBoardId={board?.id} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: 'auto' }}>
          <div style={{ fontSize: '14px', fontWeight: 500 }}>
            Xin chào, {session.user.name || session.user.username}
          </div>
          <form action={handleSignOut}>
            <button type="submit" className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>
              Đăng xuất
            </button>
          </form>
        </div>
      </div>

      {board && <KanbanBoard key={board.id} initialBoard={board} users={users} />}
    </div>
  )
}
