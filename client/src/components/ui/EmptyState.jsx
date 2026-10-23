import { ImagePlus } from 'lucide-react'

function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <div>
        <div className="empty-icon"><ImagePlus size={19} /></div>
        <h3>{title}</h3>
        <p>{description}</p>
        {action}
      </div>
    </div>
  )
}

export default EmptyState
