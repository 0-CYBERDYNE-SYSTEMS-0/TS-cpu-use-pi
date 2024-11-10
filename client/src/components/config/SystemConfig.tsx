import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { SystemConfig as SystemConfigType } from '@/lib/types';
import { updateSystemConfig } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import useSWR from 'swr';
import { getSystemConfig } from '@/lib/api';

const configSchema = z.object({
  systemMessage: z.string().min(1),
  temperature: z.number().min(0).max(1),
  maxTokens: z.number().min(1).max(4096)
});

export function SystemConfig() {
  const { data: config } = useSWR<SystemConfigType>('/api/config', getSystemConfig);
  const { toast } = useToast();
  const form = useForm<SystemConfigType>({
    resolver: zodResolver(configSchema),
    defaultValues: config
  });

  async function onSubmit(data: SystemConfigType) {
    try {
      await updateSystemConfig(data);
      toast({
        title: 'Success',
        description: 'System configuration updated'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive'
      });
    }
  }

  if (!config) return null;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="systemMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Message</FormLabel>
              <FormControl>
                <Textarea {...field} rows={4} />
              </FormControl>
              <FormDescription>
                Define the AI assistant's behavior and capabilities
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="temperature"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Temperature</FormLabel>
              <FormControl>
                <Slider
                  min={0}
                  max={1}
                  step={0.1}
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                />
              </FormControl>
              <FormDescription>
                Controls response randomness (0 = focused, 1 = creative)
              </FormDescription>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxTokens"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Tokens</FormLabel>
              <FormControl>
                <Slider
                  min={1}
                  max={4096}
                  step={1}
                  value={[field.value]}
                  onValueChange={([value]) => field.onChange(value)}
                />
              </FormControl>
              <FormDescription>
                Maximum length of the AI's response
              </FormDescription>
            </FormItem>
          )}
        />

        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  );
}
