import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Video } from 'lucide-react';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { useRole } from '@/hooks/useRole';
import { bunnyReconService, type BunnyMappingResult } from '@/services/bunny-recon';

const BunnyVideoMapPage = () => {
  const { isAdmin, isSuperadmin } = useRole();
  const [isMapping, setIsMapping] = useState(false);
  const [result, setResult] = useState<BunnyMappingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleMapVideos = async () => {
    setIsMapping(true);
    setErrorMessage('');
    try {
      const mappingResult = await bunnyReconService.mapAllVideosToLessons();
      setResult(mappingResult);
      toast.success(`Mapping complete: ${mappingResult.linked} lesson(s) linked.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorMessage(message);
      toast.error(`Failed to map Bunny videos: ${message}`);
    } finally {
      setIsMapping(false);
    }
  };

  if (!isAdmin && !isSuperadmin) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl p-8 text-center">
          <h1 className="text-2xl font-bold text-red-600">Unauthorized</h1>
          <p className="mt-2 text-gray-600">You need admin access to map Bunny videos.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Video className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Bunny Video Mapping</h1>
              <p className="text-sm text-muted-foreground">
                Fetch Bunny videos and match or create lessons from their titles.
              </p>
            </div>
          </div>

          <p className="mb-6 text-sm text-muted-foreground">
            Existing lessons are reused when they match. Missing grades, learning areas, topics,
            subtopics, or lessons are created from supported Bunny video titles.
          </p>

          <Button className="w-full sm:w-auto" onClick={handleMapVideos} disabled={isMapping}>
            {isMapping ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {isMapping ? 'Fetching and mapping videos...' : 'Fetch and Map Bunny Videos'}
          </Button>

          {errorMessage && (
            <p className="mt-4 flex items-center gap-2 text-sm text-red-600" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {errorMessage}
            </p>
          )}

          {result && (
            <section className="mt-8" aria-live="polite">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Mapping results
              </h2>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[
                  ['Videos fetched', result.totalVideos],
                  ['Lessons linked', result.linked],
                  ['Skipped', result.skipped],
                  ['Unmatched / failed', result.failed],
                ].map(([label, value]) => (
                  <div className="rounded-lg bg-muted p-4" key={label}>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-1 text-2xl font-semibold">{value}</dd>
                  </div>
                ))}
              </dl>

              {result.details.length > 0 && (
                <ul className="mt-6 max-h-96 space-y-2 overflow-y-auto">
                  {result.details.map((detail, index) => (
                    <li
                      className="rounded-md border p-3 text-sm"
                      key={`${detail.videoId}-${index}`}
                    >
                      <div className="font-medium">{detail.videoTitle}</div>
                      <div className="text-muted-foreground">
                        {detail.status === 'linked' && detail.lessonTitle
                          ? `Linked to ${detail.lessonTitle} (lesson #${detail.lessonId})`
                          : detail.message}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default BunnyVideoMapPage;
