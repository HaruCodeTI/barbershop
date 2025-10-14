# Avatar Upload System

Sistema completo de upload de avatars usando Supabase Storage.

## Arquitetura

O sistema de avatar upload consiste em:

1. **Supabase Storage Bucket** (`avatars`)
   - Bucket público para acesso direto às imagens
   - Limite de 5MB por arquivo
   - Formatos aceitos: JPEG, PNG, WebP

2. **Funções de Upload** (`/lib/storage.ts`)
   - `uploadAvatar()` - Faz upload de um novo avatar
   - `deleteAvatar()` - Remove avatar existente
   - `getAvatarUrl()` - Obtém URL pública do avatar

3. **Componente de UI** (`/components/avatar-upload.tsx`)
   - Interface drag-and-drop para upload
   - Preview em tempo real
   - Validação de tipo e tamanho
   - Feedback visual de progresso

## Configuração

### 1. Storage Bucket

O bucket `avatars` foi criado automaticamente com as seguintes políticas RLS:

```sql
-- Usuários podem fazer upload do próprio avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Usuários podem atualizar o próprio avatar
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Usuários podem deletar o próprio avatar
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars' AND
  (auth.uid()::text = (storage.foldername(name))[1])
);

-- Todos podem visualizar avatars
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
```

### 2. Estrutura de Arquivos

Os avatars são organizados por usuário:

```
avatars/
├── {userId}/
│   └── {timestamp}.{ext}
```

**Exemplo:**
```
avatars/
├── 550e8400-e29b-41d4-a716-446655440000/
│   └── 1704067200000.jpg
└── 660e9511-f39c-52e5-b827-557766551111/
    └── 1704067300000.png
```

## Uso

### Componente AvatarUpload

```tsx
import { AvatarUpload } from "@/components/avatar-upload"

function UserProfile({ user }) {
  const handleUploadComplete = (url: string) => {
    console.log("Avatar uploaded:", url)
    // Atualizar URL no banco de dados
  }

  return (
    <AvatarUpload
      userId={user.id}
      currentAvatarUrl={user.avatar_url}
      userName={user.name}
      onUploadComplete={handleUploadComplete}
      size="lg"
    />
  )
}
```

### Props do Componente

| Prop | Tipo | Descrição |
|------|------|-----------|
| `userId` | `string` | ID do usuário (obrigatório) |
| `currentAvatarUrl` | `string \| null` | URL atual do avatar |
| `userName` | `string` | Nome do usuário para fallback |
| `onUploadComplete` | `(url: string) => void` | Callback após upload bem-sucedido |
| `onDelete` | `() => void` | Callback após deletar avatar |
| `size` | `"sm" \| "md" \| "lg"` | Tamanho do avatar |

### Funções Utilitárias

```typescript
import { uploadAvatar, deleteAvatar, getAvatarUrl } from "@/lib/storage"

// Upload manual
const file = new File([blob], "avatar.jpg", { type: "image/jpeg" })
const result = await uploadAvatar(file, userId)

if (result.success) {
  console.log("Avatar URL:", result.url)
} else {
  console.error("Erro:", result.error)
}

// Deletar avatar
await deleteAvatar(userId)

// Obter URL pública
const url = getAvatarUrl(`${userId}/1704067200000.jpg`)
```

## Validações

### Tipo de Arquivo

Apenas os seguintes tipos MIME são aceitos:
- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

### Tamanho

- **Máximo:** 5MB (5.242.880 bytes)
- Arquivos maiores são rejeitados antes do upload

### Segurança

- Apenas usuários autenticados podem fazer upload
- Usuários só podem modificar seus próprios avatars
- Bucket público permite visualização por qualquer pessoa

## Integração com Banco de Dados

### Atualizar avatar_url do Barber

```typescript
import { createClient } from "@/lib/supabase/client"
import { uploadAvatar } from "@/lib/storage"

async function updateBarberAvatar(barberId: string, file: File) {
  const supabase = createClient()

  // Upload para Storage
  const result = await uploadAvatar(file, barberId)

  if (result.success && result.url) {
    // Atualizar no banco
    await supabase
      .from("barbers")
      .update({ avatar_url: result.url })
      .eq("id", barberId)
  }
}
```

### Atualizar avatar_url do Customer

```typescript
async function updateCustomerAvatar(customerId: string, file: File) {
  const supabase = createClient()

  // Upload para Storage
  const result = await uploadAvatar(file, customerId)

  if (result.success && result.url) {
    // Atualizar no banco
    await supabase
      .from("customers")
      .update({ avatar_url: result.url })
      .eq("id", customerId)
  }
}
```

## Limpeza Automática

Quando um novo avatar é enviado, o sistema:

1. Lista todos os arquivos existentes do usuário
2. Remove todos os arquivos antigos
3. Faz upload do novo arquivo

Isso evita acúmulo de arquivos não utilizados no Storage.

## Troubleshooting

### Erro: "Failed to upload"

**Possíveis causas:**
1. Arquivo excede 5MB
2. Tipo de arquivo não suportado
3. Usuário não autenticado
4. Políticas RLS incorretas

**Solução:**
- Verificar tamanho e tipo do arquivo
- Confirmar que usuário está autenticado
- Revisar políticas RLS no Supabase

### Avatar não aparece

**Possíveis causas:**
1. URL não foi salva no banco de dados
2. Bucket não é público
3. Política de SELECT não permite visualização

**Solução:**
```sql
-- Verificar se bucket é público
SELECT id, name, public FROM storage.buckets WHERE name = 'avatars';

-- Deve retornar: public = true
```

### Erro de permissão ao fazer upload

**Verificar políticas:**
```sql
-- Listar políticas do bucket
SELECT * FROM storage.policies WHERE bucket_id = 'avatars';
```

## Performance

### CDN e Caching

O Supabase Storage usa CDN automaticamente para servir imagens. Configure cache:

```typescript
const { data, error } = await supabase.storage
  .from("avatars")
  .upload(filePath, file, {
    cacheControl: "3600", // 1 hora
    upsert: false,
  })
```

### Otimização de Imagens

**Recomendações:**

1. **Redimensionar antes do upload:**
   ```typescript
   // Usar biblioteca como 'browser-image-compression'
   import imageCompression from 'browser-image-compression'

   const options = {
     maxSizeMB: 1,
     maxWidthOrHeight: 400,
     useWebWorker: true
   }

   const compressedFile = await imageCompression(file, options)
   ```

2. **Usar formato WebP:**
   - Melhor compressão
   - Suporte moderno em navegadores

## Custos

### Supabase Storage Pricing

**Free Tier:**
- 1GB de storage
- 2GB de bandwidth/mês

**Pro Tier:**
- $0.021 por GB/mês de storage
- $0.09 por GB de bandwidth

**Estimativa para 1000 usuários:**
- Avatars: ~400KB cada = 400MB storage
- Custo mensal: ~$0.008 (storage) + $0.036 (bandwidth @400MB)
- **Total: ~$0.04/mês**

## Referências

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Storage Security](https://supabase.com/docs/guides/storage/security/access-control)
- [Image Optimization](https://supabase.com/docs/guides/storage/serving/image-transformations)
