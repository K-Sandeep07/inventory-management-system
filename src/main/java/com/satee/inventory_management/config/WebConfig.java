
package com.satee.inventory_management.config;

import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/product-images}")
    private String uploadDirectory;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        Path imagePath = Paths.get(uploadDirectory)
                .toAbsolutePath()
                .normalize();

        String imageLocation = imagePath.toUri().toString();

        if (!imageLocation.endsWith("/")) {
            imageLocation += "/";
        }

        registry.addResourceHandler("/product-images/**")
                .addResourceLocations(imageLocation);
    }
}
