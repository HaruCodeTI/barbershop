#!/bin/bash

# Script para adicionar useStore import aos arquivos que ainda precisam

FILES=(
  "app/attendant/create-booking/page.tsx"
  "app/manager/services/page.tsx"
  "app/manager/barbers/page.tsx"
  "app/manager/coupons/page.tsx"
  "app/manager/loyalty/page.tsx"
  "app/manager/reports/revenue/page.tsx"
  "app/manager/reports/productivity/page.tsx"
  "app/manager/reports/occupancy/page.tsx"
)

echo "Atualizando arquivos para usar StoreContext..."

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processando $file..."

    # Adiciona import do useStore se ainda não existir
    if ! grep -q "useStore" "$file"; then
      # Encontra a última linha de import e adiciona o novo import depois
      sed -i '' '/^import.*from/a\
import { useStore } from "@/lib/hooks/use-store"
' "$file" 2>/dev/null || echo "  Aviso: Não foi possível adicionar import automaticamente em $file"
    fi

    echo "  ✓ Atualizado"
  else
    echo "  ✗ Arquivo não encontrado: $file"
  fi
done

echo "Concluído!"
