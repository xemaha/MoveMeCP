'use client'

interface WhatsAppSuccessModalProps {
  movie: {
    id: string
    title: string
  }
  recipients: string[]
  onClose: () => void
}

export function WhatsAppSuccessModal({ movie, recipients, onClose }: WhatsAppSuccessModalProps) {
  const handleWhatsApp = () => {
    const movieUrl = `${window.location.origin}/movie/${movie.id}`
    const message = `Hey! Schau dir mal "${movie.title}" an: ${movieUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            ✅ Empfehlung gespeichert!
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Du hast <strong>"{movie.title}"</strong> erfolgreich empfohlen an:
          </p>

          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <ul className="space-y-1">
              {recipients.map((name, index) => (
                <li key={index} className="text-gray-900 flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-900 mb-2">
              💡 Möchtest du deine Freundinnen direkt per WhatsApp benachrichtigen?
            </p>
            <p className="text-xs text-blue-700">
              Es öffnet sich WhatsApp mit einer vorbereiteten Nachricht, die du noch anpassen kannst.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Später
          </button>
          <button
            onClick={handleWhatsApp}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📱 WhatsApp öffnen
          </button>
        </div>
      </div>
    </div>
  )
}
