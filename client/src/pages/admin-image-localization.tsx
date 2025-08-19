import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Image, Zap, Globe, CheckCircle, AlertCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LocalizationJob {
  id: string;
  type: 'all' | 'platforms' | 'chains' | 'categories';
  status: 'idle' | 'running' | 'completed' | 'error';
  message?: string;
}

export default function AdminImageLocalization() {
  const [jobs, setJobs] = useState<LocalizationJob[]>([
    { id: 'all', type: 'all', status: 'idle' },
    { id: 'platforms', type: 'platforms', status: 'idle' },
    { id: 'chains', type: 'chains', status: 'idle' },
    { id: 'categories', type: 'categories', status: 'idle' },
  ]);
  
  const { toast } = useToast();

  const updateJobStatus = (id: string, status: LocalizationJob['status'], message?: string) => {
    setJobs(prev => prev.map(job => 
      job.id === id ? { ...job, status, message } : job
    ));
  };

  const runLocalization = async (type: LocalizationJob['type']) => {
    const endpoint = type === 'all' 
      ? '/api/admin/images/localize-all'
      : `/api/admin/images/localize-${type}`;
    
    updateJobStatus(type, 'running');
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      updateJobStatus(type, 'completed', data.message);
      toast({
        title: "Success",
        description: data.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      updateJobStatus(type, 'error', message);
      toast({
        title: "Error",
        description: `Failed to localize images: ${message}`,
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: LocalizationJob['status']) => {
    switch (status) {
      case 'running':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: LocalizationJob['status']) => {
    const variants = {
      idle: 'secondary',
      running: 'default',
      completed: 'default',
      error: 'destructive',
    } as const;

    const colors = {
      idle: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      running: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    };

    return (
      <Badge variant={variants[status]} className={colors[status]}>
        <div className="flex items-center gap-1">
          {getStatusIcon(status)}
          <span className="capitalize">{status}</span>
        </div>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Image Localization</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Download and store external images locally to eliminate dependencies on external hosts
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            External Image Detection
          </CardTitle>
          <CardDescription>
            This system automatically detects external image URLs (like CryptoLogos.cc, GitHub repositories, and other CDNs) 
            and downloads them to your local object storage. This ensures your website never depends on external hosts for images.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Image className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="font-semibold">Platform Logos</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Protocol logos from CryptoLogos.cc
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="font-semibold">Chain Icons</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Blockchain network icons
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Download className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="font-semibold">Category Images</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Category and token images
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization Jobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {jobs.map((job) => (
          <Card key={job.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">
                  {job.type === 'all' ? 'All Images' : `${job.type} Images`}
                </CardTitle>
                {getStatusBadge(job.status)}
              </div>
              <CardDescription>
                {job.type === 'all' && 'Localize all external images across platforms, chains, and categories'}
                {job.type === 'platforms' && 'Download platform logos from external sources'}
                {job.type === 'chains' && 'Download blockchain network icons'}
                {job.type === 'categories' && 'Download category and token images'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {job.message && (
                  <div className={`text-sm p-2 rounded ${
                    job.status === 'error' 
                      ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                      : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {job.message}
                  </div>
                )}
                <Button
                  onClick={() => runLocalization(job.type)}
                  disabled={job.status === 'running'}
                  className="w-full"
                  data-testid={`button-localize-${job.type}`}
                >
                  {job.status === 'running' ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Localizing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Localize {job.type === 'all' ? 'All' : job.type}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Information */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-xs">1</div>
              <div>
                <strong>Detection:</strong> Scans database for external image URLs (http://, https://)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-xs">2</div>
              <div>
                <strong>Download:</strong> Fetches images from external sources with proper error handling
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-xs">3</div>
              <div>
                <strong>Storage:</strong> Stores images in object storage with unique filenames (hash-based)
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-semibold text-xs">4</div>
              <div>
                <strong>Update:</strong> Updates database records to use local URLs (/public-objects/...)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}