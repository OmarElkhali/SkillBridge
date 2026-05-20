package com.skillbridge.user.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.common.exception.TooManyRequestsException;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.security.GithubOauthService;
import com.skillbridge.security.GoogleTokenVerifierService;
import com.skillbridge.security.JwtService;
import com.skillbridge.security.LoginAttemptService;
import com.skillbridge.user.dto.AuthResponse;
import com.skillbridge.user.dto.GoogleLoginRequest;
import com.skillbridge.user.dto.GithubLoginRequest;
import com.skillbridge.user.dto.LoginRequest;
import com.skillbridge.user.dto.RegisterRequest;
import com.skillbridge.user.dto.UserSummaryResponse;
import com.skillbridge.user.entity.Role;
import com.skillbridge.user.entity.RoleName;
import com.skillbridge.user.entity.User;
import com.skillbridge.user.repository.RoleRepository;
import com.skillbridge.user.repository.UserRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final LoginAttemptService loginAttemptService;
    private final GoogleTokenVerifierService googleTokenVerifierService;
    private final GithubOauthService githubOauthService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService,
            LoginAttemptService loginAttemptService,
            GoogleTokenVerifierService googleTokenVerifierService,
            GithubOauthService githubOauthService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.loginAttemptService = loginAttemptService;
        this.googleTokenVerifierService = googleTokenVerifierService;
        this.githubOauthService = githubOauthService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new BadRequestException("An account with this email already exists.");
        }

        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new BadRequestException("Default role USER is not configured."));

        User user = new User();
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(userRole);
        user.setActive(true);

        User saved = userRepository.save(user);
        AppUserPrincipal principal = new AppUserPrincipal(saved);
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", UserSummaryResponse.from(saved));
    }

    public AuthResponse login(LoginRequest request, String clientIp) {
        String email = request.email().trim().toLowerCase();
        if (loginAttemptService.isBlocked(email, clientIp)) {
            throw new TooManyRequestsException("Too many failed login attempts. Please try again later.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (DisabledException ex) {
            loginAttemptService.recordFailure(email, clientIp);
            throw new BadRequestException("Account is disabled. Contact an administrator.");
        } catch (BadCredentialsException ex) {
            loginAttemptService.recordFailure(email, clientIp);
            throw new BadRequestException("Invalid email or password.");
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(email, clientIp);
            throw new BadRequestException("Login failed. Please try again.");
        }

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        loginAttemptService.recordSuccess(email, clientIp);
        AppUserPrincipal principal = new AppUserPrincipal(user);
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", UserSummaryResponse.from(user));
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleTokenVerifierService.GoogleIdentity googleIdentity = googleTokenVerifierService.verify(request.idToken());
        User user = userRepository.findByEmailIgnoreCase(googleIdentity.email())
                .orElseGet(() -> createOauthUser(googleIdentity.email(), googleIdentity.firstName(), googleIdentity.lastName()));

        if (!user.isActive()) {
            throw new BadRequestException("Account is disabled. Contact an administrator.");
        }

        AppUserPrincipal principal = new AppUserPrincipal(user);
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", UserSummaryResponse.from(user));
    }

    public AuthResponse loginWithGithub(GithubLoginRequest request) {
        GithubOauthService.GithubIdentity githubIdentity = githubOauthService.authenticate(request.code(), request.redirectUri());
        User user = userRepository.findByEmailIgnoreCase(githubIdentity.email())
                .orElseGet(() -> createOauthUser(githubIdentity.email(), githubIdentity.firstName(), githubIdentity.lastName()));

        if (!user.isActive()) {
            throw new BadRequestException("Account is disabled. Contact an administrator.");
        }

        AppUserPrincipal principal = new AppUserPrincipal(user);
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", UserSummaryResponse.from(user));
    }

    private User createOauthUser(String email, String firstName, String lastName) {
        Role userRole = roleRepository.findByName(RoleName.USER)
                .orElseThrow(() -> new BadRequestException("Default role USER is not configured."));

        User user = new User();
        user.setFirstName(firstName);
        user.setLastName(lastName);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode("OAUTH_" + UUID.randomUUID()));
        user.setRole(userRole);
        user.setActive(true);
        return userRepository.save(user);
    }
}
