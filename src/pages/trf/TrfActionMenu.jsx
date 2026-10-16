import { MoreVertical } from 'lucide-react'

/**
 * Action menu component for e-TRF table rows.
 * Provides lifecycle actions (Accept/Reject) and CRUD actions.
 */
export function TrfActionMenu({ row, onEdit, onDelete, onAccept, onReject, onClose }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={onClose} title="Actions">
        <MoreVertical size={16} />
      </button>
      <div style={{
        position: 'absolute', right: 0, top: '100%', background: '#fff',
        border: '1px solid #d1d5db', borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        minWidth: 140, zIndex: 10,
      }}>
        {onEdit && (
          <button onClick={onEdit} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer' }}>
            Edit
          </button>
        )}
        {row.trfStatus === 'Pending_Feasibility' && onAccept && (
          <button onClick={onAccept} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: '#dcfce7', cursor: 'pointer', color: '#16a34a' }}>
            Accept
          </button>
        )}
        {row.trfStatus === 'Pending_Feasibility' && onReject && (
          <button onClick={onReject} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: '#fee2e2', cursor: 'pointer', color: '#dc2626' }}>
            Reject
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} style={{ display: 'block', width: '100%', padding: '8px 12px', textAlign: 'left', border: 'none', background: '#fee2e2', cursor: 'pointer', color: '#dc2626' }}>
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
