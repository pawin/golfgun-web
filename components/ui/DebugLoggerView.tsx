'use client';

import { useState, useEffect } from 'react';
import { debugLogger, LogEntry } from '@/lib/utils/debugLogger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export function DebugLoggerView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Subscribe to log updates
    const unsubscribe = debugLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  const handleClear = () => {
    debugLogger.clear();
  };

  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500';
      case 'warn':
        return 'bg-yellow-500';
      case 'success':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getLevelBadgeVariant = (level: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'outline';
      case 'success':
        return 'default';
      default:
        return 'secondary';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-full shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2"
      >
        <span className="text-xs font-mono">Debug Logs</span>
        {logs.length > 0 && (
          <Badge variant="destructive" className="rounded-full">
            {logs.length}
          </Badge>
        )}
      </button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-50 w-[600px] max-w-[90vw] shadow-2xl border-2">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Debug Logger</h3>
          {logs.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {logs.length} logs
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-7 w-7 p-0"
          >
            {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 w-7 p-0"
            disabled={logs.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-2">
            {logs.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">
                No logs yet
              </div>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedLogs.has(log.id);
                const hasData = log.data !== undefined;

                return (
                  <div
                    key={log.id}
                    className="bg-white border rounded-lg p-2 text-xs space-y-1"
                  >
                    <div className="flex items-start gap-2">
                      <div className={`w-1 h-full rounded ${getLevelColor(log.level)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant={getLevelBadgeVariant(log.level)}
                            className="text-[10px] px-1.5 py-0"
                          >
                            {log.level}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {log.source}
                          </Badge>
                          <span className="text-[10px] text-gray-500">
                            {log.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="font-mono text-gray-900 break-words">
                          {log.message}
                        </div>
                        {hasData && (
                          <div className="mt-2">
                            <button
                              onClick={() => toggleExpand(log.id)}
                              className="text-blue-600 hover:text-blue-800 text-[10px] underline"
                            >
                              {isExpanded ? 'Hide data' : 'Show data'}
                            </button>
                            {isExpanded && (
                              <pre className="mt-1 p-2 bg-gray-50 rounded text-[10px] overflow-x-auto">
                                {JSON.stringify(log.data, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}

