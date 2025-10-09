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
  DialogTrigger,
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
import { Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import {
  getWarehousesByManager,
  getCommodities,
  getSeasons,
  getManagerInspectors,
  createWarehouseCommodity,
  type CreateWarehouseCommodityPayload,
  type ApiWarehouse,
  type ApiCommodity,
  type ApiSeason,
  type ApiManagerInspector,
} from '@/lib/api'

const formSchema = z.object({
  WarehouseId: z.number().min(1, 'Please select a warehouse'),
  CommodityMasterId: z.number().min(1, 'Please select a commodity'),
  SeasonId: z.number().min(1, 'Please select a season'),
  Manager_Id: z.number().min(1, 'Manager ID is required'),
  InspectorId: z.number().min(1, 'Please select an inspector'),
})

type FormValues = z.infer<typeof formSchema>

interface CreateWarehouseCommodityDialogProps {
  onSuccess: () => void
}

export function CreateWarehouseCommodityDialog({ onSuccess }: CreateWarehouseCommodityDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [warehouses, setWarehouses] = useState<ApiWarehouse[]>([])
  const [commodities, setCommodities] = useState<ApiCommodity[]>([])
  const [seasons, setSeasons] = useState<ApiSeason[]>([])
  const [inspectors, setInspectors] = useState<ApiManagerInspector[]>([])
  const { user } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      WarehouseId: 0,
      CommodityMasterId: 0,
      SeasonId: 0,
      Manager_Id: user?.id || 0,
      InspectorId: 0,
    },
  })

  // Fetch data when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      fetchData()
    }
  }, [open, user?.id])

  const fetchData = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const [warehousesRes, commoditiesRes, seasonsRes, inspectorsRes] = await Promise.all([
        getWarehousesByManager(user.id),
        getCommodities(),
        getSeasons(),
        getManagerInspectors(user.id),
      ])

      setWarehouses(warehousesRes)
      setCommodities(commoditiesRes)
      setSeasons(seasonsRes)
      setInspectors(inspectorsRes)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load form data')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: FormValues) => {
    try {
      setLoading(true)

      const payload: CreateWarehouseCommodityPayload = {
        WarehouseId: values.WarehouseId,
        CommodityMasterId: values.CommodityMasterId,
        SeasonId: values.SeasonId,
        Manager_Id: values.Manager_Id,
        InspectorId: values.InspectorId,
      }

      await createWarehouseCommodity(payload)

      toast.success('Warehouse commodity mapping created successfully')
      setOpen(false)
      form.reset()
      onSuccess()
    } catch (error) {
      console.error('Error creating warehouse commodity mapping:', error)
      toast.error('Failed to create warehouse commodity mapping')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="mb-4">
          <Plus className="mr-2 h-4 w-4" />
          Add Warehouse Commodity
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Warehouse Commodity Mapping</DialogTitle>
          <DialogDescription>
            Create a new mapping between a warehouse, commodity, and season for inspection management.
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
              name="InspectorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inspector</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an inspector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id.toString()}>
                          {inspector.Full_Name || inspector.UserName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Mapping'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
