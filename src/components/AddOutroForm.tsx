import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AddOutroFormProps {
  onAdicionar: (nome: string) => void
}

export function AddOutroForm({ onAdicionar }: AddOutroFormProps) {
  const [nome, setNome] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nomeLimpo = nome.trim()
    if (!nomeLimpo) return
    onAdicionar(nomeLimpo)
    setNome('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-3">
      <Input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Adicionar item em Outros"
        className="flex-1"
      />
      <Button type="submit" size="icon" aria-label="Adicionar item" disabled={!nome.trim()}>
        <Plus className="h-5 w-5" />
      </Button>
    </form>
  )
}
