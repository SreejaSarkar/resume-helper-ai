import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
} from "@mui/material";
import BlockIcon from "@mui/icons-material/Block";

const SuspendedDialog = ({ open, message, onConfirm }) => {
    return (
        <Dialog
            open={open}
            maxWidth="xs"
            fullWidth
            BackdropProps={{
                sx: {
                    backdropFilter: "blur(6px)",
                    backgroundColor: "rgba(0,0,0,0.4)",
                },
            }}
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    p: 1,
                    boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
                },
            }}
        >

            <DialogTitle>
                <Box
                    display="flex"
                    alignItems="center"
                    gap={1.5}
                    fontWeight={600}
                >
                    <BlockIcon color="error" />
                    Account Suspended
                </Box>
            </DialogTitle>

            <DialogContent>
                <Typography fontSize={15} color="text.secondary">
                    {"Your account has been temporarily suspended. Please contact Admin."}
                </Typography>
            </DialogContent>

            <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
                <Button
                    variant="contained"
                    color="error"
                    onClick={onConfirm}
                    sx={{ borderRadius: 2, textTransform: "none", px: 4 }}
                >
                    OK
                </Button>
            </DialogActions>

        </Dialog>
    );
};

export default SuspendedDialog;
