import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  messageLoads: number;
  conversationLoads: number;
  listenerConnections: number;
  listenerDisconnections: number;
  idleTime: number;
  activeTime: number;
  lastActivity: Date;
}

export function useChatPerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    messageLoads: 0,
    conversationLoads: 0,
    listenerConnections: 0,
    listenerDisconnections: 0,
    idleTime: 0,
    activeTime: 0,
    lastActivity: new Date(),
  });

  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());
  const isIdleRef = useRef<boolean>(false);

  // Track message loads
  const trackMessageLoad = () => {
    setMetrics(prev => ({
      ...prev,
      messageLoads: prev.messageLoads + 1,
      lastActivity: new Date(),
    }));
    lastActivityRef.current = Date.now();
  };

  // Track conversation loads
  const trackConversationLoad = () => {
    setMetrics(prev => ({
      ...prev,
      conversationLoads: prev.conversationLoads + 1,
      lastActivity: new Date(),
    }));
    lastActivityRef.current = Date.now();
  };

  // Track listener connections
  const trackListenerConnection = () => {
    setMetrics(prev => ({
      ...prev,
      listenerConnections: prev.listenerConnections + 1,
      lastActivity: new Date(),
    }));
    lastActivityRef.current = Date.now();
  };

  // Track listener disconnections
  const trackListenerDisconnection = () => {
    setMetrics(prev => ({
      ...prev,
      listenerDisconnections: prev.listenerDisconnections + 1,
      lastActivity: new Date(),
    }));
    lastActivityRef.current = Date.now();
  };

  // Track idle state changes
  const trackIdleState = (isIdle: boolean) => {
    const now = Date.now();
    if (isIdleRef.current !== isIdle) {
      if (isIdle) {
        // Just became idle
        const activeTime = now - lastActivityRef.current;
        setMetrics(prev => ({
          ...prev,
          activeTime: prev.activeTime + activeTime,
        }));
      } else {
        // Just became active
        const idleTime = now - lastActivityRef.current;
        setMetrics(prev => ({
          ...prev,
          idleTime: prev.idleTime + idleTime,
        }));
        lastActivityRef.current = now;
      }
      isIdleRef.current = isIdle;
    }
  };

  // Update activity time
  const updateActivity = () => {
    const now = Date.now();
    if (!isIdleRef.current) {
      setMetrics(prev => ({
        ...prev,
        activeTime: prev.activeTime + (now - lastActivityRef.current),
        lastActivity: new Date(),
      }));
    }
    lastActivityRef.current = now;
  };

  // Get performance summary
  const getPerformanceSummary = () => {
    const totalTime = Date.now() - startTimeRef.current;
    const efficiency = metrics.activeTime / totalTime;
    
    return {
      ...metrics,
      totalTime,
      efficiency: Math.round(efficiency * 100),
      averageMessageLoadsPerMinute: Math.round((metrics.messageLoads / (totalTime / 60000)) * 100) / 100,
      averageConversationLoadsPerMinute: Math.round((metrics.conversationLoads / (totalTime / 60000)) * 100) / 100,
    };
  };

  // Log performance metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const summary = getPerformanceSummary();
      console.log('📊 Chat Performance Summary:', {
        efficiency: `${summary.efficiency}%`,
        messageLoads: summary.messageLoads,
        conversationLoads: summary.conversationLoads,
        listenerConnections: summary.listenerConnections,
        listenerDisconnections: summary.listenerDisconnections,
        avgMessageLoadsPerMin: summary.averageMessageLoadsPerMinute,
        avgConversationLoadsPerMin: summary.averageConversationLoadsPerMinute,
      });
    }, 60000); // Log every minute

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    trackMessageLoad,
    trackConversationLoad,
    trackListenerConnection,
    trackListenerDisconnection,
    trackIdleState,
    updateActivity,
    getPerformanceSummary,
  };
}
