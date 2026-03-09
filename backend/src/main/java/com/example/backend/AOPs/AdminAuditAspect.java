package com.example.backend.AOPs;
import com.example.backend.Models.AuditLog;
import com.example.backend.Models.User;
import com.example.backend.Repositories.AuditLogRepository;
import com.example.backend.Repositories.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import java.time.LocalDateTime;
@Aspect
@Component
public class AdminAuditAspect {
    @Autowired
    private AuditLogRepository auditLogRepository;
    @Autowired
    private UserRepository userRepository;
    @AfterReturning(pointcut = "@annotation(auditAction)", returning = "result")
    public void logAuditAction(JoinPoint joinPoint, AuditAction auditAction, Object result) {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            HttpServletRequest request = attributes != null ? attributes.getRequest() : null;
            String ipAddress = request != null ? request.getRemoteAddr() : "UNKNOWN";
            String email = null;
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !"anonymousUser".equals(authentication.getPrincipal())) {
                email = authentication.getName();
            }
            if ((email == null || email.isBlank()) && request != null) {
                String paramEmail = request.getParameter("email");
                if (paramEmail == null) paramEmail = request.getParameter("facultyEmail");
                if (paramEmail != null && !paramEmail.isBlank()) email = paramEmail;
            }
            if (email == null || email.isBlank()) {
                System.err.println("AuditLog skipped: could not resolve actor email");
                return;
            }
            User actor = userRepository.findByEmail(email).orElse(null);
            if (actor == null) {
                System.err.println("AuditLog skipped: User not found for email " + email);
                return;
            }
            Long targetEntityId = null;
            for (Object arg : joinPoint.getArgs()) {
                if (arg instanceof Long) {
                    targetEntityId = (Long) arg;
                    break;
                }
            }
            AuditLog log = AuditLog.builder()
                    .actor(actor)
                    .action(auditAction.action())
                    .targetEntity(auditAction.targetEntity())
                    .targetEntityId(targetEntityId)
                    .details("Action executed: " + joinPoint.getSignature().getName())
                    .timestamp(LocalDateTime.now())
                    .ipAddress(ipAddress)
                    .build();
            auditLogRepository.save(log);
        } catch (Exception e) {
            System.err.println("Failed to log audit action: " + e.getMessage());
        }
    }
}