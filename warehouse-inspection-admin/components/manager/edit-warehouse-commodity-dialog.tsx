'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/auth-context'
import {
  getWarehousesByManager,
  getCommodities,
  getSeasons,
  updateWarehouseCommodity,
  type ApiWarehouseCommodity,
  type ApiWarehouse,
  type ApiCommodity,
  type ApiSeason
} from '@/lib/api'

const formSchema = z.object({
  WarehouseId: z.number().min(1, 'Please select a warehouse'),
  CommodityMasterId: z.number().min(1, 'Please select a commodity'),
  SeasonId: z.number().min(1, 'Please select a season'),
  Is_Active: z.number().min(0).max(1, 'Status must be 0 or 1'),
})

type FormValues = z.infer<typeof formSchema>

interface EditWarehouseCommodityDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapping: ApiWarehouseCommodity | null
  onSuccess: () => void
}

export function EditWarehouseCommodityDialog({
  open,
  onOpenChange,
  mapping,
  onSuccess
}: EditWarehouseCommodityDialogProps) {
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([])
  const [commodities, setCommodities] = useState<ApiCommodity[]>([])
  const [seasons, setSeasons] = useState<ApiSeason[]>([])
  const { user } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      WarehouseId: 0,
      CommodityMasterId: 0,
      SeasonId: 0,
      Is_Active: 1,
    },
  })

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      fetchData()
    }
  }, [open, user?.id])

  // Update form values when mapping changes
  useEffect(() => {
    if (mapping) {
      form.reset({
        WarehouseId: mapping.WarehouseId,
        CommodityMasterId: mapping.CommodityMasterId,
        SeasonId: mapping.SeasonId,
        Is_Active: mapping.Is_Active,
      })
    }
  }, [mapping, form])

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [warehousesRes, commoditiesRes, seasonsRes] = await Promise.all([
        getWarehousesByManager(user.id),
        getCommodities(),
        getSeasons(),
      ])

      setWarehouses(warehousesRes)
      setCommodities(commoditiesRes)
      setSeasons(seasonsRes)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    if (!mapping) return

    try {
      setLoading(true)

      await updateWarehouseCommodity(mapping.Idwarehouse_commodity, {
        WarehouseId: values.WarehouseId,
        CommodityMasterId: values.CommodityMasterId,
        SeasonId: values.SeasonId,
        Manager_Id: mapping.Manager_Id,
        Is_Active: values.Is_Active,
      })

      toast.success('Warehouse commodity mapping updated successfully')
      onOpenChange(false)
      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Error updating warehouse commodity mapping:', error)
      toast.error('Failed to update warehouse commodity mapping')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Warehouse Commodity Mapping</DialogTitle>
          <DialogDescription>
            Update the mapping between a warehouse, commodity, and season.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="WarehouseId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warehouse</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a warehouse" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.Id_Warehouse} value={warehouse.Id_Warehouse.toString()}>
                          {warehouse.Warehouse_Name} {warehouse.Location ? `(${warehouse.Location})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="CommodityMasterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Commodity</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a commodity" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commodities.map((commodity) => (
                        <SelectItem key={commodity.IdCommodity} value={commodity.IdCommodity.toString()}>
                          {commodity.Commodity_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="SeasonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Season</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a season" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {seasons.map((season) => (
                        <SelectItem key={season.IdSeason} value={season.IdSeason.toString()}>
                          {season.Season_Name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="Is_Active"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="0">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : 'Update Mapping'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
