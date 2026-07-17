import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable Cross-Origin Resource Sharing (CORS)
  app.enableCors();
  
  // Set up global validation for incoming requests
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Use our centralized exception filter for errors
  app.useGlobalFilters(new HttpExceptionFilter());

  // Configure Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('INFNOVA Internship Applicant Management API')
    .setDescription('Administrative API documentation for managing internship candidates.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application successfully running on port ${port}`);
  console.log(`Open API Docs available at: http://localhost:${port}/api/docs`);
}
bootstrap();