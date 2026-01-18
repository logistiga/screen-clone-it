<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'action' => $this->action,
            'module' => $this->module,
            'table_name' => $this->table_name ?? $this->module,
            'record_id' => $this->record_id,
            'document_type' => $this->document_type,
            'document_id' => $this->document_id,
            'document_numero' => $this->document_numero,
            'description' => $this->description,
            'details' => $this->details,
            'old_values' => $this->old_values,
            'new_values' => $this->new_values,
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,
            'created_at' => $this->created_at?->toISOString(),
            
            // Relations - inclure le nom de l'utilisateur
            'user' => $this->whenLoaded('user', fn() => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'nom' => $this->user->nom,
                'email' => $this->user->email,
            ]),
        ];
    }
}
