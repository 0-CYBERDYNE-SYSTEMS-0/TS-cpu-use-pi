import { useState } from 'react';
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
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, MinusCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';

const parameterSchema = z.object({
  name: z.string().min(1, 'Parameter name is required'),
  type: z.enum(['string', 'number', 'boolean']),
  optional: z.boolean().default(false),
});

const toolSchema = z.object({
  name: z.string().min(1, 'Tool name is required')
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, 'Tool name must start with a letter and contain only letters and numbers'),
  description: z.string().min(1, 'Description is required'),
  parameters: z.array(parameterSchema).min(1, 'At least one parameter is required'),
});

type ToolFormValues = z.infer<typeof toolSchema>;

interface CreateToolFormProps {
  onSuccess?: () => void;
}

export function CreateToolForm({ onSuccess }: CreateToolFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ToolFormValues>({
    resolver: zodResolver(toolSchema),
    defaultValues: {
      name: '',
      description: '',
      parameters: [{ name: '', type: 'string', optional: false }],
    },
  });

  async function onSubmit(data: ToolFormValues) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tool');
      }

      toast({
        title: 'Success',
        description: 'Tool created successfully',
      });

      form.reset();
      mutate('/api/tools');
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create tool',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="myCustomTool" />
              </FormControl>
              <FormDescription>
                A unique identifier for your tool
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="What does this tool do?" />
              </FormControl>
              <FormDescription>
                Explain the purpose and functionality of your tool
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <FormLabel>Parameters</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const current = form.getValues('parameters');
                form.setValue('parameters', [
                  ...current,
                  { name: '', type: 'string', optional: false },
                ]);
              }}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Parameter
            </Button>
          </div>

          {form.watch('parameters').map((_, index) => (
            <div key={index} className="flex gap-4 items-start p-4 border rounded-lg">
              <FormField
                control={form.control}
                name={`parameters.${index}.name`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className={index !== 0 ? 'sr-only' : ''}>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="parameterName" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`parameters.${index}.type`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className={index !== 0 ? 'sr-only' : ''}>Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="number">Number</SelectItem>
                        <SelectItem value="boolean">Boolean</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`parameters.${index}.optional`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className={index !== 0 ? 'sr-only' : ''}>
                        Optional
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const current = form.getValues('parameters');
                    form.setValue(
                      'parameters',
                      current.filter((_, i) => i !== index)
                    );
                  }}
                >
                  <MinusCircle className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Tool'}
        </Button>
      </form>
    </Form>
  );
}
