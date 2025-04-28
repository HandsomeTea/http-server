import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter, NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} from '@opentelemetry/sdk-metrics';
import { getENV } from '@/configs';

(() => {
    if (getENV('ENABLE_OTEL_LOGS') !== 'yes') {
        return;
    }

    const sdk = new NodeSDK({
        traceExporter: new ConsoleSpanExporter(),
        metricReader: new PeriodicExportingMetricReader({
            exporter: new ConsoleMetricExporter(),
        }),
        instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();

    const provider = new NodeTracerProvider();
    provider.register();
    new HttpInstrumentation().enable();  // 自动为HTTP请求注入traceparent
})();
