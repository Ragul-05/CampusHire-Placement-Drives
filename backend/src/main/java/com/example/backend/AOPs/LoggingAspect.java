package com.example.backend.AOPs;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

import java.util.Arrays;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Aspect
@Component
public class LoggingAspect {

    private static final Logger logger = LoggerFactory.getLogger(LoggingAspect.class);
    private static final int MAX_VALUE_LENGTH = 80;

    @Pointcut("within(com.example.backend.Controllers..*)")
    public void controllerPointcut() {
        // Pointcut for controller layer
    }

    @Pointcut("within(com.example.backend.Services..*)")
    public void servicePointcut() {
        // Pointcut for service layer
    }

    @Around("controllerPointcut()")
    public Object logControllerExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        HttpServletRequest request = getCurrentRequest();
        String requestId = UUID.randomUUID().toString().substring(0, 8);
        long start = System.currentTimeMillis();

        logger.info(
                "[{}] Incoming {} {} -> {}({})",
                requestId,
                request != null ? request.getMethod() : "N/A",
                request != null ? request.getRequestURI() : "N/A",
                joinPoint.getSignature().toShortString(),
                formatArguments(joinPoint.getArgs())
        );

        try {
            Object result = joinPoint.proceed();
            logger.info(
                    "[{}] Completed {} in {} ms",
                    requestId,
                    joinPoint.getSignature().toShortString(),
                    System.currentTimeMillis() - start
            );
            return result;
        } catch (Throwable ex) {
            logger.error(
                    "[{}] Failed {} after {} ms: {}",
                    requestId,
                    joinPoint.getSignature().toShortString(),
                    System.currentTimeMillis() - start,
                    ex.getMessage(),
                    ex
            );
            throw ex;
        }
    }

    @Around("servicePointcut()")
    public Object logServiceExecution(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.currentTimeMillis();
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();

        logger.debug(
                "Entering {}.{}({})",
                signature.getDeclaringType().getSimpleName(),
                signature.getName(),
                formatArguments(joinPoint.getArgs())
        );

        try {
            Object result = joinPoint.proceed();
            logger.info(
                    "Service {} completed in {} ms",
                    joinPoint.getSignature().toShortString(),
                    System.currentTimeMillis() - start
            );
            return result;
        } catch (Throwable ex) {
            logger.error(
                    "Service {} failed after {} ms: {}",
                    joinPoint.getSignature().toShortString(),
                    System.currentTimeMillis() - start,
                    ex.getMessage(),
                    ex
            );
            throw ex;
        }
    }

    private HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    private String formatArguments(Object[] args) {
        if (args == null || args.length == 0) {
            return "";
        }

        return Arrays.stream(args)
                .filter(Objects::nonNull)
                .filter(arg -> !(arg instanceof HttpServletRequest))
                .map(this::sanitizeValue)
                .collect(Collectors.joining(", "));
    }

    private String sanitizeValue(Object value) {
        if (value instanceof Number || value instanceof Boolean || value instanceof Enum<?>) {
            return String.valueOf(value);
        }

        if (value instanceof String stringValue) {
            return maskSensitiveText(stringValue);
        }

        String rendered = value.getClass().getSimpleName();
        if (rendered == null || rendered.isBlank()) {
            rendered = value.getClass().getName();
        }
        return rendered;
    }

    private String maskSensitiveText(String value) {
        if (value.contains("@")) {
            String[] parts = value.split("@", 2);
            String local = parts[0];
            String maskedLocal = local.length() <= 2
                    ? "**"
                    : local.substring(0, 2) + "***";
            return maskedLocal + "@" + parts[1];
        }

        if (value.length() > 32) {
            return "[REDACTED]";
        }

        if (value.length() > MAX_VALUE_LENGTH) {
            return value.substring(0, MAX_VALUE_LENGTH) + "...";
        }

        return value;
    }
}
