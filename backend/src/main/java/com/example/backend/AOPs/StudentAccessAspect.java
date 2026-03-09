package com.example.backend.AOPs;

import com.example.backend.Exceptions.UnauthorizedException;
import com.example.backend.Utils.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
public class StudentAccessAspect {

    @Autowired
    private JwtUtils jwtUtils;

    // Apply to all controllers inside /api/student except the Auth controller
    @Before("execution(* com.example.backend.Controllers..*(..)) && @within(org.springframework.web.bind.annotation.RequestMapping) && !execution(* com.example.backend.Controllers.StudentAuthController.*(..))")
    public void checkStudentAccess(JoinPoint joinPoint) {
        HttpServletRequest request = ((ServletRequestAttributes) RequestContextHolder.currentRequestAttributes())
                .getRequest();
        String path = request.getRequestURI();

        if (path.startsWith("/api/student/")) {
            // Because we don't have Spring Security, we're simulating the check here
            // In a real scenario we would check the Authorization token -> Bearer {token}
            // For now, if there is an auth header, we validate it.

            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (!jwtUtils.validateToken(token)) {
                    throw new UnauthorizedException("Invalid or expired authentication token");
                }
            } else {
                // To prevent breaking UI that doesn't send tokens yet (since testing requires
                // passing email)
                // We will relax this strictly for development purposes if they just pass an
                // email param
                if (request.getParameter("email") == null) {
                    throw new UnauthorizedException("Authentication token or email required for Student endpoints");
                }
            }
        }
    }
}
