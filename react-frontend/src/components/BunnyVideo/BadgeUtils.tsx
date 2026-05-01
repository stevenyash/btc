import { CheckCircle, Loader2, Clock, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const getTranscodingBadge = (status: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-500">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-500">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const getSyncStatusBadge = (status?: string) => {
  switch (status) {
    case 'completed':
      return (
        <Badge className="bg-green-500 text-white">
          <CheckCircle className="h-3 w-3 mr-1" />
          Synced
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-500 text-white">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      );
    case 'pending':
      return (
        <Badge className="bg-amber-500 text-white">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case 'failed':
      return (
        <Badge className="bg-red-500 text-white">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};
