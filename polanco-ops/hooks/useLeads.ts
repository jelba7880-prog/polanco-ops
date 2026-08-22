'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Lead, LeadStatus } from '@/lib/supabase/types'
import type { LeadFormValues } from '@/lib/validations/lead.schema'

const supabase = createClient()

export const leadKeys = {
  all: ['leads'] as const,
  lists: () => [...leadKeys.all, 'list'] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
}

async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      profiles:assigned_to (
        id,
        full_name,
        role
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Lead[]
}

async function fetchLeadById(id: string): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .select(`
      *,
      profiles:assigned_to (
        id,
        full_name,
        role
      )
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  const lead = data as Lead

  // Fetched as a separate query rather than an embedded `cars:car_id (...)`
  // select — leads.car_id isn't backed by a foreign key PostgREST can embed
  // through (deal_sheets, which has the same kind of bare car_id column,
  // stores a snapshot instead of joining for the same reason). A car that's
  // since been archived/deleted still resolves here so staff can find it;
  // if the lookup fails for any reason, just leave the preview off rather
  // than breaking the whole lead page over it.
  if (lead.car_id) {
    const { data: car } = await supabase
      .from('cars')
      .select('id, slug, year, make, model, price_usd, status, car_images ( url, is_cover, sort_order )')
      .eq('id', lead.car_id)
      .maybeSingle()

    lead.cars = car as Lead['cars']
  }

  return lead
}

export function useLeads() {
  return useQuery({
    queryKey: leadKeys.lists(),
    queryFn: fetchLeads,
  })
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: () => fetchLeadById(id),
    enabled: !!id,
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (values: LeadFormValues) => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error ?? 'Failed to create lead')
      }

      const { lead } = await response.json()
      return lead as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          status,
          last_contacted: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Partial<LeadFormValues> }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({
          ...values,
          last_contacted: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Lead
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.lists() })
    },
  })
}
