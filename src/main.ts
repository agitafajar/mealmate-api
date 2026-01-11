import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");

  const config = new DocumentBuilder()
    .setTitle("MealMate API")
    .setDescription("API documentation for MealMate backend")
    .setVersion("1.0")
    .addBearerAuth()
    .addServer("/mealmate")
    .addServer("/")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  await app.listen(process.env.PORT || 4000);
  console.log(`✅ MealMate API running on port ${process.env.PORT || 4000}`);
  console.log(`📄 Swagger docs available at /api/docs`);
}
bootstrap();
