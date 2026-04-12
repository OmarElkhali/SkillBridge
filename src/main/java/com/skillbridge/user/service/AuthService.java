package com.skillbridge.user.service;

import com.skillbridge.common.exception.BadRequestException;
import com.skillbridge.security.AppUserPrincipal;
import com.skillbridge.security.JwtService;
import com.skillbridge.user.dto.AuthResponse;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
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

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password())
            );
        } catch (BadCredentialsException ex) {
            throw new BadRequestException("Invalid email or password.");
        }

        User user = userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
                .orElseThrow(() -> new BadRequestException("Invalid email or password."));

        AppUserPrincipal principal = new AppUserPrincipal(user);
        return new AuthResponse(jwtService.generateToken(principal), "Bearer", UserSummaryResponse.from(user));
    }
}
