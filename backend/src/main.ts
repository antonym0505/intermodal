import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Enable CORS for frontend
    app.enableCors();

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        }),
    );

    // Swagger API documentation
    const config = new DocumentBuilder()
        .setTitle('Intermodal Unit Tracking API')
        .setDescription(
            'API for managing intermodal container NFTs with dual-state possession model',
        )
        .setVersion('1.0')
        .addTag('containers', 'Container registration and lookup')
        .addTag('handoffs', 'Possession transfer operations')
        .addTag('facilities', 'Facility registry management')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    const port = process.env.PORT || 3000;
    await app.listen(port);

    console.log(`🚀 Intermodal API running on http://localhost:${port}`);
    console.log(`📚 Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();
